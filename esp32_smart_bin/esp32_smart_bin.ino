#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>

// -----------------------------------------
// WIFI CONFIGURATION
// -----------------------------------------
const char* ssid = "YOUR_WIFI_SSID";
const char* password = "YOUR_WIFI_PASSWORD";

// -----------------------------------------
// SERVER CONFIGURATION
// -----------------------------------------
// Replace with your local machine's IP address or remote server URL
const char* serverUrl = "http://<YOUR_SERVER_IP>:5001/api/waste";

// 🔐 AUTH TOKEN (Optional - if backend API authentication is enabled)
const char* authToken = "YOUR_JWT_AUTH_TOKEN";

const String locality = "Locality-1";
const String houseId = "House-101";

// -----------------------------------------
// SENSOR PINS
// -----------------------------------------
#define IR_PIN 13
#define MOISTURE_PIN 34
#define METAL_PIN 14

// -----------------------------------------
// CALIBRATION VARIABLES
// -----------------------------------------
int moistureThreshold = 2500;
int dryValue = 0;
int wetValue = 0;



// -----------------------------------------
// SETUP
// -----------------------------------------
void setup() {
  Serial.begin(115200);

  pinMode(IR_PIN, INPUT);
  pinMode(MOISTURE_PIN, INPUT);
  pinMode(METAL_PIN, INPUT);

  delay(2000);


  Serial.print("Connecting to WiFi: ");
  Serial.println(ssid);

  WiFi.begin(ssid, password);

  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }

  Serial.println("\nWiFi connected!");
  Serial.print("ESP32 IP: ");
  Serial.println(WiFi.localIP());
}

// -----------------------------------------
// LOOP
// -----------------------------------------
void loop() {
  int objectPresent = digitalRead(IR_PIN);

  if (objectPresent == LOW) {
    Serial.println("\n[EVENT] Waste detected!");
    delay(1500);

    // Moisture averaging
    int moistureValue = 0;
    for (int i = 0; i < 5; i++) {
      moistureValue += analogRead(MOISTURE_PIN);
      delay(10);
    }
    moistureValue /= 5;

    int metalValue = digitalRead(METAL_PIN);

    Serial.print("Moisture: ");
    Serial.println(moistureValue);

    Serial.print("Metal: ");
    Serial.println(metalValue);

    String wasteType;

    // FINAL LOGIC
    if (metalValue == LOW) {
      wasteType = "Metal";
    } 
    else if (moistureValue < moistureThreshold) {
      wasteType = "Wet";
    } 
    else {
      wasteType = "Dry";
    }

    Serial.println("-> Waste Type: " + wasteType);

    delay(1000);

    // -------- Send Data --------
    if (WiFi.status() == WL_CONNECTED) {
      HTTPClient http;

      http.begin(serverUrl);
      http.setTimeout(5000);

      http.addHeader("Content-Type", "application/json");
      http.addHeader("Authorization", String("Bearer ") + authToken);

      StaticJsonDocument<200> doc;
      doc["locality"] = locality;
      doc["houseNumber"] = houseId;   
      doc["wasteType"] = wasteType;

      String requestBody;
      serializeJson(doc, requestBody);

      Serial.println("-> Sending:");
      Serial.println(requestBody);

      int httpResponseCode = http.POST(requestBody);

      if (httpResponseCode > 0) {
        Serial.print("-> Success HTTP: ");
        Serial.println(httpResponseCode);
      } else {
        Serial.print("-> Error: ");
        Serial.println(httpResponseCode);
      }

      http.end();
    } else {
      Serial.println("-> WiFi Disconnected! Reconnecting...");
      WiFi.disconnect();
      WiFi.begin(ssid, password);
    }

    // Wait until object removed
    while (digitalRead(IR_PIN) == LOW) {
      delay(100);
    }

    Serial.println("Object Removed");
    delay(1000);
  } 
  else {
    Serial.println("No Object...");
    delay(3000);
  }
}