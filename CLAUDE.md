# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Core Development
- `npm run dev` - Start development server (both client and server)
- `npm run build` - Build for production (client and server bundling)
- `npm start` - Start production server
- `npm run check` - TypeScript type checking

### Database Operations
- `npm run db:push` - Push schema changes to database using Drizzle Kit
- Database requires PostgreSQL (configured via DATABASE_URL environment variable)

## Project Architecture

### Full-Stack Structure
This is a monorepo with client/server structure:
- **Client**: React 18 + TypeScript + Vite frontend in `/client` directory
- **Server**: Express.js + TypeScript backend in `/server` directory  
- **Shared**: Common schemas and types in `/shared` directory

### Key Architectural Patterns

#### Database Layer (Drizzle ORM)
- Schema definitions in `shared/schema.ts` with comprehensive table structure
- Uses PostgreSQL with UUID primary keys and proper foreign key relationships
- Two main data models: Admin dashboard (aggregate) and Customer home management (detailed)
- Real-time features: WebSocket integration for live updates

#### Frontend Architecture
- **Router**: Wouter for lightweight client-side routing
- **State Management**: TanStack Query for server state, React hooks for local state
- **UI Components**: Shadcn/ui with Radix primitives and Tailwind CSS
- **Real-time**: WebSocket hook (`use-websocket.tsx`) for live dashboard updates

#### API Design
- RESTful endpoints with proper error handling and Zod validation
- WebSocket server on `/ws` path for real-time features
- Emergency controls with instant synchronization across all connected clients
- Comprehensive logging and monitoring built-in

### Import Paths and Aliases
- `@/*` - Client source files (`./client/src/*`)
- `@shared/*` - Shared schemas and types (`./shared/*`)
- `@assets/*` - Attached assets directory

### Key Components Architecture

#### Dashboard System
- **System Health Monitoring**: Real-time service status tracking
- **Emergency Controls**: Content kill switch, maintenance mode, sound alerts
- **Business Metrics**: Device discovery rates, MRR, customer analytics
- **Activity Logging**: Comprehensive audit trail with severity levels

#### Smart Home Features
- **Home Management**: Multi-home support with role-based access
- **Device Discovery**: Multiple methods (WiFi scan, manual, barcode)
- **Emergency Alerts**: Real-time emergency communication system
- **AI Chat Integration**: Context-aware device assistance

### Database Schema Key Tables
- `systemHealth` - Service status monitoring
- `emergencySettings` - Emergency control states
- `customerHomes` - Customer home records
- `devices` - Smart home device inventory
- `emergencyAlerts` - Emergency communication
- `chatMessages` - AI assistant interactions

### WebSocket Integration
- Real-time updates every 3 minutes for dashboard data
- Instant synchronization for emergency control changes
- Automatic reconnection handling
- Events: `system_health_updated`, `emergency_setting_updated`, `metrics_updated`

## Development Environment

### Required Environment Variables
- `DATABASE_URL` - PostgreSQL connection string (required)
- `PORT` - Server port (defaults to 5000)
- `NODE_ENV` - Environment mode (development/production)

### Tech Stack Dependencies
- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS, Shadcn/ui
- **Backend**: Express.js, TypeScript, Drizzle ORM, WebSocket
- **Database**: PostgreSQL with UUID support
- **Validation**: Zod schemas for runtime type safety
- **Real-time**: WebSocket with automatic reconnection

### Project Structure Notes
- All TypeScript with strict mode enabled
- Path aliases configured in both Vite and TypeScript
- Comprehensive error handling and logging
- Mobile-responsive design throughout
- Security-first architecture with input validation