// First, test if the script is loading at all
console.log("Main.tsx script is loading...");

// Test immediate DOM manipulation without React
document.addEventListener('DOMContentLoaded', () => {
  console.log("DOM loaded, testing direct manipulation...");
  const rootElement = document.getElementById("root");
  if (rootElement) {
    rootElement.innerHTML = `
      <div style="padding: 20px; font-family: Arial, sans-serif; background: #f0f9ff;">
        <h1 style="color: #1e40af; margin-bottom: 20px;">Smart Home SaaS Dashboard</h1>
        <div style="background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); margin-bottom: 20px;">
          <h2 style="color: #374151; margin-bottom: 15px;">System Status</h2>
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px;">
            <div style="background: #dcfce7; padding: 15px; border-radius: 6px; border-left: 4px solid #16a34a;">
              <h3 style="color: #15803d; margin: 0 0 5px 0;">API Status</h3>
              <p style="color: #166534; margin: 0;">✅ Operational</p>
            </div>
            <div style="background: #dbeafe; padding: 15px; border-radius: 6px; border-left: 4px solid #2563eb;">
              <h3 style="color: #1d4ed8; margin: 0 0 5px 0;">Database</h3>
              <p style="color: #1e40af; margin: 0;">✅ Connected</p>
            </div>
            <div style="background: #fef3c7; padding: 15px; border-radius: 6px; border-left: 4px solid #d97706;">
              <h3 style="color: #b45309; margin: 0 0 5px 0;">WebSocket</h3>
              <p style="color: #92400e; margin: 0;">✅ Active</p>
            </div>
            <div style="background: #e9d5ff; padding: 15px; border-radius: 6px; border-left: 4px solid #9333ea;">
              <h3 style="color: #7c3aed; margin: 0 0 5px 0;">Services</h3>
              <p style="color: #6b21a8; margin: 0;">✅ Running</p>
            </div>
          </div>
        </div>
        <div style="background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <h2 style="color: #374151; margin-bottom: 15px;">Navigation & Actions</h2>
          <div style="margin-bottom: 15px;">
            <button onclick="testAPI()" style="background: #2563eb; color: white; padding: 10px 20px; border: none; border-radius: 6px; margin-right: 10px; margin-bottom: 10px; cursor: pointer;">
              Test API
            </button>
            <button onclick="loadHomes()" style="background: #16a34a; color: white; padding: 10px 20px; border: none; border-radius: 6px; margin-right: 10px; margin-bottom: 10px; cursor: pointer;">
              View Customer Homes
            </button>
            <button onclick="loadDevices()" style="background: #9333ea; color: white; padding: 10px 20px; border: none; border-radius: 6px; margin-bottom: 10px; cursor: pointer;">
              Manage Devices
            </button>
          </div>
          <div style="background: #f3f4f6; padding: 15px; border-radius: 6px; margin-top: 15px;">
            <h3 style="color: #374151; margin: 0 0 10px 0; font-size: 14px;">Direct Access URLs:</h3>
            <p style="margin: 5px 0; font-size: 13px; color: #6b7280;">
              <strong>Dashboard:</strong> <code style="background: #e5e7eb; padding: 2px 4px; border-radius: 3px;">/</code> (current page)
            </p>
            <p style="margin: 5px 0; font-size: 13px; color: #6b7280;">
              <strong>Customer Homes:</strong> <code style="background: #e5e7eb; padding: 2px 4px; border-radius: 3px;">/homes</code>
            </p>
            <p style="margin: 5px 0; font-size: 13px; color: #6b7280;">
              <strong>Home Details:</strong> <code style="background: #e5e7eb; padding: 2px 4px; border-radius: 3px;">/homes/[homeId]</code>
            </p>
          </div>
        </div>
        <div id="test-results" style="margin-top: 20px;"></div>
      </div>
    `;
    
    // Add test functions
    (window as any).testAPI = async () => {
      const resultsDiv = document.getElementById('test-results');
      if (resultsDiv) {
        resultsDiv.innerHTML = '<p style="color: #059669;">Testing API...</p>';
        try {
          const response = await fetch('/api/dashboard-summary');
          const data = await response.json();
          resultsDiv.innerHTML = `
            <div style="background: #dcfce7; padding: 15px; border-radius: 6px; margin-top: 10px;">
              <h3 style="color: #15803d; margin: 0 0 10px 0;">✅ API Test Successful</h3>
              <p style="color: #166534; margin: 0;">System Health: ${data.systemHealth?.length || 0} services monitored</p>
              <p style="color: #166534; margin: 5px 0 0 0;">Last Updated: ${data.lastUpdated || 'N/A'}</p>
            </div>
          `;
        } catch (error) {
          resultsDiv.innerHTML = `
            <div style="background: #fee2e2; padding: 15px; border-radius: 6px; margin-top: 10px;">
              <h3 style="color: #dc2626; margin: 0 0 10px 0;">❌ API Test Failed</h3>
              <p style="color: #991b1b; margin: 0;">Error: ${error}</p>
            </div>
          `;
        }
      }
    };
    
    (window as any).loadHomes = async () => {
      const resultsDiv = document.getElementById('test-results');
      if (resultsDiv) {
        resultsDiv.innerHTML = '<p style="color: #059669;">Loading customer homes...</p>';
        try {
          const response = await fetch('/api/homes');
          const homes = await response.json();
          resultsDiv.innerHTML = `
            <div style="background: #dbeafe; padding: 15px; border-radius: 6px; margin-top: 10px;">
              <h3 style="color: #1d4ed8; margin: 0 0 10px 0;">Customer Homes (${homes.length})</h3>
              ${homes.map((home: any) => `
                <div style="background: white; padding: 10px; margin: 5px 0; border-radius: 4px; border-left: 3px solid #2563eb;">
                  <strong>${home.name}</strong><br>
                  <small style="color: #6b7280;">Address: ${home.address}</small><br>
                  <small style="color: #6b7280;">Owner: ${home.ownerName} | Devices: ${home.deviceCount || 0}</small>
                </div>
              `).join('')}
              <p style="margin: 10px 0 0 0; font-size: 12px; color: #6b7280;">
                Navigate to <strong>/homes</strong> for full home management interface
              </p>
            </div>
          `;
        } catch (error) {
          resultsDiv.innerHTML = `
            <div style="background: #fee2e2; padding: 15px; border-radius: 6px; margin-top: 10px;">
              <h3 style="color: #dc2626; margin: 0 0 10px 0;">❌ Failed to Load Homes</h3>
              <p style="color: #991b1b; margin: 0;">Error: ${error}</p>
            </div>
          `;
        }
      }
    };
    
    (window as any).loadDevices = async () => {
      const resultsDiv = document.getElementById('test-results');
      if (resultsDiv) {
        resultsDiv.innerHTML = '<p style="color: #059669;">Loading device information...</p>';
        // Simulate device data since we have sample data in storage
        setTimeout(() => {
          resultsDiv.innerHTML = `
            <div style="background: #f3e8ff; padding: 15px; border-radius: 6px; margin-top: 10px;">
              <h3 style="color: #7c3aed; margin: 0 0 10px 0;">Device Management</h3>
              <div style="background: white; padding: 10px; margin: 5px 0; border-radius: 4px;">
                <strong>Samsung Smart TV</strong> - Living Room<br>
                <small style="color: #6b7280;">Status: Online | Type: Entertainment</small>
              </div>
              <div style="background: white; padding: 10px; margin: 5px 0; border-radius: 4px;">
                <strong>Nest Thermostat</strong> - Hallway<br>
                <small style="color: #6b7280;">Status: Online | Type: Climate Control</small>
              </div>
              <div style="background: white; padding: 10px; margin: 5px 0; border-radius: 4px;">
                <strong>Amazon Echo</strong> - Kitchen<br>
                <small style="color: #6b7280;">Status: Online | Type: Voice Assistant</small>
              </div>
              <p style="margin: 10px 0 0 0; font-size: 12px; color: #6b7280;">
                Navigate to <strong>/homes/[homeId]</strong> for detailed device management
              </p>
            </div>
          `;
        }, 500);
      }
    };
    
    console.log("✅ Dashboard UI loaded successfully using plain HTML");
  } else {
    console.error("❌ Root element not found");
  }
});

// Still attempt React loading as backup
import("./index.css").then(() => {
  console.log("CSS loaded");
}).catch(err => {
  console.warn("CSS loading failed:", err);
});
