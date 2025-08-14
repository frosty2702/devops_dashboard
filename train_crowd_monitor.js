// ESP32 Configuration - UPDATE THIS IP ADDRESS!
let ESP32_IP = "192.168.1.100"; // You'll get this from ESP32 Serial Monitor
let ESP32_URL = `http://${ESP32_IP}/api/status`;

// Live data from ESP32 - will be updated directly
let compartmentData = {
    compartment1: {
        crowdStatus: 'GREEN',
        sensors: {
            ir1: false,
            ir2: false,
            ir3: false,
            ultrasonic: false
        },
        lastUpdated: new Date(),
        isReal: true // Real ESP32 data
    },
    compartment2: {
        crowdStatus: 'GREEN',
        sensors: {
            ir1: false,
            ir2: false,
            ultrasonic: false
        },
        lastUpdated: new Date(),
        isReal: false // Simulated data
    },
    compartment3: {
        crowdStatus: 'YELLOW',
        sensors: {
            ir1: true,
            ir2: false,
            ultrasonic: true
        },
        lastUpdated: new Date(),
        isReal: false // Simulated data
    }
};

// ESP32 data storage
let esp32Data = {
    status: 'GREEN',
    timestamp: 0,
    sensors: {
        ir1_crowd: false,
        ir2_crowd: false,
        ir3_crowd: false,
        ultrasonic_crowd: false
    },
    device_id: 'ESP32_CrowdDetector_001'
};

// Configuration
const CROWD_THRESHOLDS = {
    LOW: 30,
    MODERATE: 45
};

// Simulation settings for compartments 2 & 3
const SIMULATION_INTERVAL = 10000; // Update every 10 seconds
const SIMULATION_PROBABILITY = {
    GREEN: 0.35,  // 35% chance
    YELLOW: 0.50, // 50% chance  
    RED: 0.15     // 15% chance
};

// Initialize the dashboard
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚊 Train Crowd Monitor initializing...');
    
    // Show IP input dialog for ESP32 connection (Compartment 1)
    showIPDialog();
    
    // Start simulation for compartments 2 & 3
    startCompartmentSimulation();
    
    console.log('🚊 Train Crowd Monitor initialized');
});

// Update the entire dashboard
function updateDashboard() {
    Object.keys(compartmentData).forEach(compartmentId => {
        updateCompartment(compartmentId, compartmentData[compartmentId]);
    });
    
    updateLastSync();
}

// Update individual compartment
function updateCompartment(compartmentId, data) {
    const card = document.getElementById(compartmentId);
    const levelElement = document.getElementById(compartmentId.replace('compartment', 'level'));
    
    if (!card || !levelElement) {
        console.error(`Elements not found for ${compartmentId}`);
        return;
    }
    
    // Determine crowd level and colors based on crowd status
    const crowdLevel = data.crowdStatus.toLowerCase();
    const crowdInfo = getCrowdInfo(crowdLevel);
    
    // Update card styling
    card.className = `compartment-card ${crowdLevel}`;
    
    // Update level text
    levelElement.textContent = crowdInfo.text;
    
    // Update sensor indicators
    updateSensorIndicators(compartmentId, data.sensors);
    
    // Note: Last updated time element removed from UI
    
    const dataSource = data.isReal ? '(ESP32)' : '(Simulated)';
    console.log(`📊 Updated ${compartmentId}: ${data.crowdStatus} ${dataSource}`);
}

// Update sensor indicators
function updateSensorIndicators(compartmentId, sensors) {
    const compartmentNum = compartmentId.replace('compartment', '');
    
    ['ir1', 'ir2', 'ultrasonic'].forEach(sensorType => {
        const indicator = document.getElementById(`sensor${compartmentNum}-${sensorType}`);
        if (indicator) {
            if (sensors[sensorType]) {
                indicator.classList.add('active');
                indicator.title = `${sensorType.toUpperCase()} sensor detecting crowd`;
            } else {
                indicator.classList.remove('active');
                indicator.title = `${sensorType.toUpperCase()} sensor clear`;
            }
        }
    });
}

// Determine crowd level based on crowd status
function getCrowdLevel(status) {
    return status.toLowerCase();
}

// Get crowd level information
function getCrowdInfo(level) {
    const crowdLevels = {
        green: { text: 'LOW CROWD', description: 'Comfortable seating available' },
        yellow: { text: 'MODERATE CROWD', description: 'Limited seating available' },
        red: { text: 'HIGH CROWD', description: 'Standing room only' }
    };
    
    return crowdLevels[level] || crowdLevels.green;
}

// Format time ago
function formatTimeAgo(date) {
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);
    
    if (diffInSeconds < 60) {
        return `${diffInSeconds} sec ago`;
    } else if (diffInSeconds < 3600) {
        const minutes = Math.floor(diffInSeconds / 60);
        return `${minutes} min ago`;
    } else {
        const hours = Math.floor(diffInSeconds / 3600);
        return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    }
}

// Update connection status (simplified - no UI elements)
function updateConnectionStatus(isConnected) {
    if (isConnected) {
        console.log('✅ Connected to ESP32');
    } else {
        console.log('❌ Connection lost - Reconnecting...');
    }
}

// Update last sync time (simplified - no UI elements)
function updateLastSync() {
    console.log('🔄 Data synced at:', new Date().toLocaleTimeString());
}

// Simulate real-time updates (replace with Firebase listeners)
function startRealTimeUpdates() {
    // Simulate data changes every 10 seconds
    setInterval(() => {
        simulateDataUpdate();
        updateDashboard();
    }, 10000);
    
    // Update time displays every 30 seconds
    setInterval(() => {
        updateTimeDisplays();
    }, 30000);
}

// Simulate data updates (replace with actual Firebase data)
function simulateDataUpdate() {
    // Randomly update passenger counts
    Object.keys(compartmentData).forEach(compartmentId => {
        const data = compartmentData[compartmentId];
        
        // Random passenger count change (-5 to +5)
        const change = Math.floor(Math.random() * 11) - 5;
        data.passengerCount = Math.max(0, Math.min(60, data.passengerCount + change));
        
        // Random sensor updates
        data.sensors.ir1 = Math.random() > 0.7;
        data.sensors.ir2 = Math.random() > 0.8;
        data.sensors.ultrasonic = Math.random() > 0.6;
        
        // Update timestamp
        data.lastUpdated = new Date();
    });
    
    console.log('🔄 Simulated data update');
}

// Update all time displays
function updateTimeDisplays() {
    ['time1', 'time2', 'time3'].forEach(timeId => {
        const compartmentId = 'compartment' + timeId.replace('time', '');
        const timeElement = document.getElementById(timeId);
        if (timeElement && compartmentData[compartmentId]) {
            timeElement.textContent = formatTimeAgo(compartmentData[compartmentId].lastUpdated);
        }
    });
}

// ESP32 Direct Connection Functions
function showIPDialog() {
    // Always show IP input dialog (don't use stored IP automatically)
    console.log('📱 Showing IP input dialog...');
    
    // Show IP input dialog
    const ip = prompt('🚊 Enter ESP32 IP Address\n\n(Check Arduino Serial Monitor for IP like: 192.168.43.105)\n\nExample: 192.168.1.100', '192.168.1.100');
    
    if (ip && ip.trim() !== '') {
        ESP32_IP = ip.trim();
        ESP32_URL = `http://${ESP32_IP}/api/status`;
        localStorage.setItem('esp32_ip', ip.trim());
        console.log('✅ IP address set to:', ESP32_IP);
        startESP32Connection();
    } else {
        console.log('❌ No IP address entered');
        alert('⚠️ No IP address entered!\n\nPlease refresh the page and enter your ESP32 IP address.');
    }
}

function startESP32Connection() {
    console.log('🔗 Connecting to ESP32 at:', ESP32_URL);
    console.log('🔧 ESP32 IP:', ESP32_IP);
    updateConnectionStatus(false); // Start as disconnected
    
    // Test connection first
    console.log('🧪 Testing ESP32 connection...');
    
    // Start fetching data
    fetchESP32Data();
    
    // Set up periodic updates every 2 seconds
    setInterval(fetchESP32Data, 2000);
}

function fetchESP32Data() {
    fetch(ESP32_URL)
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            return response.json();
        })
        .then(data => {
            console.log('📡 Received ESP32 data:', data);
            console.log('🎯 Status from ESP32:', data.status);
            console.log('🔍 Sensors from ESP32:', data.sensors);
            updateConnectionStatus(true);
            
            // Update ESP32 data
            esp32Data = data;
            
            // Convert ESP32 status to passenger count and update display
            convertESP32DataToCompartmentData(data);
            updateDashboard();
            updateLastSync();
            
            console.log('✅ Dashboard updated with ESP32 data');
            console.log('🎯 Compartment 1 should now show:', data.status);
        })
        .catch(error => {
            console.error('❌ ESP32 connection error:', error);
            updateConnectionStatus(false);
            
            // Show helpful error message
            if (error.message.includes('fetch')) {
                console.log('💡 Make sure ESP32 is connected to WiFi and the IP address is correct');
                console.log('💡 Current ESP32 URL:', ESP32_URL);
                console.log('💡 You can change the IP by clearing localStorage and refreshing');
            }
        });
}

// Convert ESP32 crowd detection status to compartment data
function convertESP32DataToCompartmentData(esp32Data) {
    // Count active sensors for logging
    const activeSensors = [
        esp32Data.sensors?.ir1_crowd,
        esp32Data.sensors?.ir2_crowd, 
        esp32Data.sensors?.ir3_crowd,
        esp32Data.sensors?.ultrasonic_crowd
    ].filter(Boolean).length;
    
    // Update compartment 1 with real ESP32 data
    compartmentData.compartment1 = {
        crowdStatus: esp32Data.status,
        sensors: {
            ir1: esp32Data.sensors?.ir1_crowd || false,
            ir2: esp32Data.sensors?.ir2_crowd || false,
            ir3: esp32Data.sensors?.ir3_crowd || false,
            ultrasonic: esp32Data.sensors?.ultrasonic_crowd || false
        },
        lastUpdated: new Date(esp32Data.timestamp || Date.now()),
        isReal: true
    };
    
    console.log(`🔄 Updated Compartment 1 with ESP32 data: ${esp32Data.status} (${activeSensors} active sensors)`);
}

// Start simulation for compartments 2 & 3
function startCompartmentSimulation() {
    // Initial update
    updateSimulatedCompartments();
    
    // Set up periodic updates
    setInterval(updateSimulatedCompartments, SIMULATION_INTERVAL);
    
    console.log('🎭 Started simulation for compartments 2 & 3');
}

// Update simulated compartments
function updateSimulatedCompartments() {
    ['compartment2', 'compartment3'].forEach(compartmentId => {
        const random = Math.random();
        let newStatus, newSensors;
        
        if (random < SIMULATION_PROBABILITY.GREEN) {
            newStatus = 'GREEN';
            newSensors = {
                ir1: Math.random() > 0.8,
                ir2: Math.random() > 0.9,
                ultrasonic: Math.random() > 0.85
            };
        } else if (random < SIMULATION_PROBABILITY.GREEN + SIMULATION_PROBABILITY.YELLOW) {
            newStatus = 'YELLOW';
            newSensors = {
                ir1: Math.random() > 0.4,
                ir2: Math.random() > 0.6,
                ultrasonic: Math.random() > 0.5
            };
        } else {
            newStatus = 'RED';
            newSensors = {
                ir1: Math.random() > 0.2,
                ir2: Math.random() > 0.3,
                ultrasonic: Math.random() > 0.2
            };
        }
        
        compartmentData[compartmentId] = {
            crowdStatus: newStatus,
            sensors: newSensors,
            lastUpdated: new Date(),
            isReal: false
        };
        
        console.log(`🎭 Simulated ${compartmentId}: ${newStatus}`);
    });
    
    // Update dashboard with new simulated data
    updateDashboard();
}

// Utility function to reset ESP32 IP
function resetESP32IP() {
    localStorage.removeItem('esp32_ip');
    location.reload();
}

// Export functions for potential external use
window.TrainCrowdMonitor = {
    updateCompartment,
    updateConnectionStatus,
    getCrowdLevel,
    formatTimeAgo,
    compartmentData,
    CROWD_THRESHOLDS
};

// Add some visual feedback for user interactions
document.addEventListener('click', function(e) {
    if (e.target.classList.contains('compartment-card')) {
        // Add click effect
        e.target.style.transform = 'scale(0.98)';
        setTimeout(() => {
            e.target.style.transform = '';
        }, 150);
    }
});

// Handle window visibility changes
document.addEventListener('visibilitychange', function() {
    if (document.hidden) {
        console.log('📱 App went to background');
    } else {
        console.log('📱 App returned to foreground');
        // Refresh data when app returns to foreground
        updateDashboard();
    }
});

console.log('🚀 Train Crowd Monitor JavaScript loaded successfully');

