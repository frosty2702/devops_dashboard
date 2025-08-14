#include <WiFi.h>
#include <WebServer.h>
#include <ArduinoJson.h>

// WiFi credentials - UPDATE THESE!
#define WIFI_SSID "YOUR_WIFI_NAME"
#define WIFI_PASSWORD "YOUR_WIFI_PASSWORD"

// Pin configuration
const int IR1 = 4;   // Footboard Left
const int IR2 = 5;   // Footboard Right
const int IR3 = 18;  // Pathway
const int TRIG = 13; // Ultrasonic Trigger
const int ECHO = 12; // Ultrasonic Echo

// Web server on port 80
WebServer server(80);

// Timing variables
unsigned long crowdStart[3] = {0, 0, 0};
bool crowdDetected[3] = {false, false, false};
const unsigned long minCrowdTime = 10000; // 10 seconds
const unsigned long confirmCrowdTime = 15000; // 15 seconds

// Ultrasonic threshold for crowd (in cm)
const int ultraThreshold = 100; // Adjust based on compartment size

// Current status variables
String currentStatus = "GREEN";
bool ultrasonicCrowd = false;
long currentDistance = 0;

void setup() {
  Serial.begin(115200);

  pinMode(IR1, INPUT);
  pinMode(IR2, INPUT);
  pinMode(IR3, INPUT);
  pinMode(TRIG, OUTPUT);
  pinMode(ECHO, INPUT);

  delay(1000);
  Serial.println("Crowd detection system starting...");

  // Connect to WiFi
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  Serial.print("Connecting to WiFi");
  
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  
  Serial.println();
  Serial.println("✅ WiFi connected!");
  Serial.print("📍 IP Address: ");
  Serial.println(WiFi.localIP());
  Serial.print("🌐 Access dashboard at: http://");
  Serial.println(WiFi.localIP());

  // Setup web server routes
  setupWebServer();
  
  // Start web server
  server.begin();
  Serial.println("🚀 Web server started!");
}

long readDistanceCM() {
  digitalWrite(TRIG, LOW);
  delayMicroseconds(2);
  digitalWrite(TRIG, HIGH);
  delayMicroseconds(10);
  digitalWrite(TRIG, LOW);

  long duration = pulseIn(ECHO, HIGH, 30000); // timeout 30ms
  if (duration == 0) return 999; // no echo
  return duration * 0.0343 / 2;
}

void checkIRSensor(int sensorPin, int index) {
  int reading = digitalRead(sensorPin);

  if (reading == 1) { // object detected
    if (!crowdDetected[index]) {
      if (crowdStart[index] == 0) {
        crowdStart[index] = millis();
      } else if (millis() - crowdStart[index] > confirmCrowdTime) {
        crowdDetected[index] = true;
      }
    }
  } else {
    crowdStart[index] = 0;
    crowdDetected[index] = false;
  }
}

void loop() {
  // Handle web server requests
  server.handleClient();
  
  // Check IR sensors with timing logic
  checkIRSensor(IR1, 0); // Footboard Left
  checkIRSensor(IR2, 1); // Footboard Right
  checkIRSensor(IR3, 2); // Pathway

  // Ultrasonic crowd detection
  currentDistance = readDistanceCM();
  ultrasonicCrowd = currentDistance < ultraThreshold;

  // Count total crowded sensors
  int crowdCount = crowdDetected[0] + crowdDetected[1] + crowdDetected[2] + ultrasonicCrowd;

  // Determine crowd status
  if (crowdCount <= 1) {
    currentStatus = "GREEN";
  } else if (crowdCount == 2) {
    currentStatus = "YELLOW";
  } else {
    currentStatus = "RED";
  }

  // Print results (keep your original serial output)
  Serial.println("------ Crowd Status ------");
  Serial.printf("IR1 (Footboard Left): %s\n", crowdDetected[0] ? "CROWDED" : "CLEAR");
  Serial.printf("IR2 (Footboard Right): %s\n", crowdDetected[1] ? "CROWDED" : "CLEAR");
  Serial.printf("IR3 (Pathway): %s\n", crowdDetected[2] ? "CROWDED" : "CLEAR");
  Serial.printf("Ultrasonic Distance: %ld cm -> %s\n", currentDistance, ultrasonicCrowd ? "CROWDED" : "CLEAR");
  Serial.printf("Overall Status: %s (Count: %d/4)\n", currentStatus.c_str(), crowdCount);
  Serial.println("--------------------------\n");

  delay(1000); // Update every 1 second
}

// Web server setup
void setupWebServer() {
  // Enable CORS for all requests
  server.onNotFound([]() {
    server.sendHeader("Access-Control-Allow-Origin", "*");
    server.send(404, "text/plain", "Not Found");
  });

  // Handle preflight OPTIONS requests
  server.on("/api/status", HTTP_OPTIONS, []() {
    server.sendHeader("Access-Control-Allow-Origin", "*");
    server.sendHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
    server.sendHeader("Access-Control-Allow-Headers", "Content-Type");
    server.send(200);
  });

  // Main API endpoint for crowd status
  server.on("/api/status", HTTP_GET, []() {
    server.sendHeader("Access-Control-Allow-Origin", "*");
    server.sendHeader("Content-Type", "application/json");

    // Create JSON response
    DynamicJsonDocument doc(1024);
    doc["status"] = currentStatus;
    doc["timestamp"] = millis();
    doc["sensors"]["ir1_crowd"] = crowdDetected[0];
    doc["sensors"]["ir2_crowd"] = crowdDetected[1];
    doc["sensors"]["ir3_crowd"] = crowdDetected[2];
    doc["sensors"]["ultrasonic_crowd"] = ultrasonicCrowd;
    doc["device_id"] = "ESP32_CrowdDetector_001";
    doc["uptime"] = millis() / 1000;
    doc["distance_cm"] = currentDistance;

    String jsonString;
    serializeJson(doc, jsonString);

    server.send(200, "application/json", jsonString);
    Serial.println("📡 API request served: " + jsonString);
  });

  // Simple test page
  server.on("/", HTTP_GET, []() {
    server.sendHeader("Access-Control-Allow-Origin", "*");
    String html = "<!DOCTYPE html><html><head><title>ESP32 Crowd Monitor</title></head>";
    html += "<body style='font-family: Arial; padding: 20px;'>";
    html += "<h1>🚊 ESP32 Crowd Detection System</h1>";
    html += "<h2>Current Status: <span style='color: ";
    html += (currentStatus == "GREEN" ? "green" : (currentStatus == "YELLOW" ? "orange" : "red"));
    html += ";'>" + currentStatus + "</span></h2>";
    html += "<p><strong>Sensors:</strong></p>";
    html += "<ul>";
    html += "<li>IR1 (Footboard Left): " + String(crowdDetected[0] ? "CROWDED" : "CLEAR") + "</li>";
    html += "<li>IR2 (Footboard Right): " + String(crowdDetected[1] ? "CROWDED" : "CLEAR") + "</li>";
    html += "<li>IR3 (Pathway): " + String(crowdDetected[2] ? "CROWDED" : "CLEAR") + "</li>";
    html += "<li>Ultrasonic: " + String(currentDistance) + "cm - " + String(ultrasonicCrowd ? "CROWDED" : "CLEAR") + "</li>";
    html += "</ul>";
    html += "<p><a href='/api/status'>View Raw JSON Data</a></p>";
    html += "<p style='color: #666; font-size: 12px;'>Uptime: " + String(millis()/1000) + " seconds</p>";
    html += "</body></html>";
    
    server.send(200, "text/html", html);
  });
}
