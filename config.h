#ifndef CONFIG_H
#define CONFIG_H

// ===== WIFI CONFIGURATION =====
#define WIFI_SSID "your-wifi-ssid"
#define WIFI_PASSWORD "your-wifi-password"

// ===== FIREBASE CONFIGURATION =====
#define FIREBASE_HOST "your-project-id-default-rtdb.firebaseio.com"
#define FIREBASE_AUTH "your-database-secret-or-token"

// ===== PIN ASSIGNMENTS =====
#define IR_SENSOR_1_PIN 2    // Footboard 1
#define IR_SENSOR_2_PIN 4    // Footboard 2  
#define IR_SENSOR_3_PIN 5    // Pathway between seats
#define ULTRASONIC_TRIG_PIN 18
#define ULTRASONIC_ECHO_PIN 19

// ===== TIMING CONSTANTS =====
#define MIN_DETECTION_TIME 10000      // 10 seconds - minimum time to consider as movement
#define CROWD_DETECTION_TIME 15000    // 15 seconds - time to consider as crowd
#define CROWD_RESET_TIME 30000        // 30 seconds - time to reset crowd status after no detection
#define ULTRASONIC_READ_INTERVAL 500  // 500ms - interval between ultrasonic readings
#define STATUS_PRINT_INTERVAL 5000    // 5 seconds - interval for status printing

// ===== SENSOR THRESHOLDS =====
#define ULTRASONIC_THRESHOLD 50       // Distance threshold in cm for crowd detection
#define ULTRASONIC_TIMEOUT 30000      // 30ms timeout for ultrasonic sensor reading

// ===== DEVICE IDENTIFICATION =====
#define DEVICE_ID "ESP32_CrowdDetector_001"

// ===== FIREBASE PATHS =====
#define FIREBASE_CURRENT_STATUS_PATH "/crowd_detection/current_status"
#define FIREBASE_HISTORY_PATH "/crowd_detection/history/"

#endif
