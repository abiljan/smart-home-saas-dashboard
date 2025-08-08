/**
 * YOLOv8 Service Manager
 * Automatically starts and manages the Python YOLOv8 service
 */

import { spawn, ChildProcess } from 'child_process';
import { existsSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { env, logger } from './config.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '..');

export class YOLOServiceManager {
  private yoloProcess: ChildProcess | null = null;
  private isStarting = false;
  private startupAttempts = 0;
  private maxStartupAttempts = 3;
  private serviceUrl = env.YOLO_SERVICE_URL || 'http://localhost:5001';

  async initialize(): Promise<void> {
    logger.info('🚀 Initializing YOLOv8 service manager...');
    
    // Check if YOLOv8 service is already running
    const isRunning = await this.checkServiceHealth();
    if (isRunning) {
      logger.info('✅ YOLOv8 service already running');
      return;
    }

    // Check if Python and dependencies are available
    const canStart = await this.checkDependencies();
    if (!canStart) {
      logger.warn('⚠️  YOLOv8 dependencies not available. Installing automatically...');
      await this.installDependencies();
    }

    // Start the YOLOv8 service
    await this.startYOLOService();
  }

  private async checkServiceHealth(): Promise<boolean> {
    try {
      const response = await fetch(`${this.serviceUrl}/health`, {
        method: 'GET',
        timeout: 2000
      });
      return response.ok;
    } catch (error) {
      return false;
    }
  }

  private async checkDependencies(): Promise<boolean> {
    // First check if dependencies were installed during npm install
    const statusFile = join(projectRoot, '.python-deps-installed');
    if (existsSync(statusFile)) {
      logger.debug('Python dependencies already installed via npm postinstall');
      return true;
    }

    return new Promise((resolve) => {
      // Check if Python is available
      const pythonCheck = spawn('python', ['--version'], { 
        stdio: 'pipe',
        shell: true 
      });

      pythonCheck.on('close', (code) => {
        if (code !== 0) {
          // Try python3
          const python3Check = spawn('python3', ['--version'], { 
            stdio: 'pipe',
            shell: true 
          });
          
          python3Check.on('close', (code) => {
            resolve(code === 0);
          });
        } else {
          resolve(true);
        }
      });

      pythonCheck.on('error', () => {
        resolve(false);
      });
    });
  }

  private async installDependencies(): Promise<void> {
    logger.info('📦 Dependencies should have been installed during npm install...');
    logger.info('⚠️  If you see this message, try running: npm install');
    
    // This should rarely be called now since dependencies are installed via postinstall
    return Promise.resolve();
  }

  private async startYOLOService(): Promise<void> {
    if (this.isStarting || this.yoloProcess) {
      return;
    }

    this.isStarting = true;
    this.startupAttempts++;

    logger.info(`🐍 Starting YOLOv8 service (attempt ${this.startupAttempts}/${this.maxStartupAttempts})...`);

    try {
      const pythonCmd = process.platform === 'win32' ? 'python' : 'python3';
      const yoloScriptPath = join(projectRoot, 'yolo_service.py');

      // Check if the YOLOv8 script exists
      if (!existsSync(yoloScriptPath)) {
        throw new Error('YOLOv8 service script not found');
      }

      this.yoloProcess = spawn(pythonCmd, [yoloScriptPath], {
        cwd: projectRoot,
        stdio: ['pipe', 'pipe', 'pipe'],
        shell: true,
        detached: false
      });

      // Handle process output
      this.yoloProcess.stdout?.on('data', (data) => {
        const output = data.toString().trim();
        if (output) {
          logger.info(`[YOLOv8] ${output}`);
        }
      });

      this.yoloProcess.stderr?.on('data', (data) => {
        const output = data.toString().trim();
        if (output && !output.includes('WARNING')) {
          logger.warn(`[YOLOv8] ${output}`);
        }
      });

      this.yoloProcess.on('close', (code) => {
        logger.info(`YOLOv8 service exited with code ${code}`);
        this.yoloProcess = null;
        this.isStarting = false;

        // Auto-restart on unexpected exit (not during shutdown)
        if (code !== 0 && !this.isShuttingDown && this.startupAttempts < this.maxStartupAttempts) {
          logger.warn('🔄 YOLOv8 service crashed, attempting restart...');
          setTimeout(() => {
            this.startYOLOService();
          }, 5000);
        }
      });

      this.yoloProcess.on('error', (error) => {
        logger.error('❌ YOLOv8 service error:', error.message);
        this.yoloProcess = null;
        this.isStarting = false;
      });

      // Wait for service to be ready
      await this.waitForServiceReady();
      
      logger.info('✅ YOLOv8 service started successfully');
      this.isStarting = false;

    } catch (error) {
      this.isStarting = false;
      logger.error('❌ Failed to start YOLOv8 service:', error.message);
      
      if (this.startupAttempts < this.maxStartupAttempts) {
        logger.info(`⏳ Retrying in 10 seconds... (${this.startupAttempts}/${this.maxStartupAttempts})`);
        setTimeout(() => {
          this.startYOLOService();
        }, 10000);
      } else {
        logger.warn('⚠️  YOLOv8 service startup failed. Object detection will use OpenAI only.');
      }
    }
  }

  private async waitForServiceReady(): Promise<void> {
    const maxWait = 60000; // 60 seconds
    const checkInterval = 2000; // 2 seconds
    const startTime = Date.now();

    return new Promise((resolve, reject) => {
      const checkHealth = async () => {
        if (Date.now() - startTime > maxWait) {
          reject(new Error('YOLOv8 service startup timeout'));
          return;
        }

        const isReady = await this.checkServiceHealth();
        if (isReady) {
          resolve();
        } else {
          setTimeout(checkHealth, checkInterval);
        }
      };

      checkHealth();
    });
  }

  private isShuttingDown = false;

  async shutdown(): Promise<void> {
    this.isShuttingDown = true;
    
    if (this.yoloProcess) {
      logger.info('🛑 Shutting down YOLOv8 service...');
      
      // Graceful shutdown
      this.yoloProcess.kill('SIGTERM');
      
      // Force kill after 5 seconds if still running
      setTimeout(() => {
        if (this.yoloProcess && !this.yoloProcess.killed) {
          logger.warn('⚠️  Force killing YOLOv8 service...');
          this.yoloProcess.kill('SIGKILL');
        }
      }, 5000);

      this.yoloProcess = null;
    }
  }

  isRunning(): boolean {
    return this.yoloProcess !== null && !this.yoloProcess.killed;
  }

  async restart(): Promise<void> {
    await this.shutdown();
    await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds
    await this.startYOLOService();
  }
}

// Singleton instance
export const yoloManager = new YOLOServiceManager();