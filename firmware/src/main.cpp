#include "user_app.h" // Include the user application header
#include <Arduino.h>
#include <ArduinoOTA.h>
#include <ESPmDNS.h>
#include <HTTPClient.h>
#include <Update.h>
#include <WebServer.h>
#include <WiFi.h>
#include <WiFiUdp.h>


// wifi credentials
const char *ssid = WIFI_SSID;
const char *password = WIFI_PASSWORD;

const int LED_PIN = 2; // the built-in led

WebServer server(80);

// --- Handlers ---
// These handlers can control the 'isUserAppActive' flag to enable/disable user
// logic

void handleLedOn() {
  isUserAppActive = true;
  // Reset user app state if needed (optional)
  server.sendHeader("Access-Control-Allow-Origin", "*");
  server.send(200, "text/plain", "User App Active (Morse/Effects ON)");
  Serial.println("User App ON");
}

void handleLedOff() {
  isUserAppActive = false;
  digitalWrite(LED_PIN, LOW); // Turn off immediately
  server.sendHeader("Access-Control-Allow-Origin", "*");
  server.send(200, "text/plain", "User App Inactive (LED OFF)");
  Serial.println("User App OFF");
}

void handleToggle() {
  if (isUserAppActive) {
    handleLedOff();
  } else {
    handleLedOn();
  }
}

void handleRoot() {
  server.sendHeader("Access-Control-Allow-Origin", "*");
  String message = "ESP32 Core is running!\n";
  message += "User App Status: ";
  message += isUserAppActive ? "ACTIVE" : "INACTIVE";
  server.send(200, "text/plain", message);
}

// --- OTA Logic (Preserved) ---

String executeOTAFromURL(String url) {
  HTTPClient http;
  Serial.println("Starting OTA from URL: " + url);

  http.begin(url);
  int httpCode = http.GET();

  if (httpCode != HTTP_CODE_OK) {
    http.end();
    return "Error: HTTP GET failed, code " + String(httpCode);
  }

  int contentLength = http.getSize();
  if (contentLength <= 0) {
    http.end();
    return "Error: Content-Length is invalid";
  }

  bool canBegin = Update.begin(contentLength);
  if (!canBegin) {
    http.end();
    return "Error: Not enough space for OTA";
  }

  WiFiClient *stream = http.getStreamPtr();
  size_t written = Update.writeStream(*stream);

  if (written != contentLength) {
    http.end();
    return "Error: Written " + String(written) + " / " + String(contentLength);
  }

  if (!Update.end()) {
    http.end();
    return "Error: Update.end() failed. Error #: " + String(Update.getError());
  }

  if (!Update.isFinished()) {
    http.end();
    return "Error: Update not finished via isFinished()";
  }

  http.end();
  return "Success";
}

void handleOTAUpdate() {
  server.sendHeader("Access-Control-Allow-Origin", "*");

  if (!server.hasArg("url")) {
    server.send(400, "text/plain", "Missing 'url' parameter");
    return;
  }

  String url = server.arg("url");
  server.send(200, "text/plain", "Starting OTA update from " + url + "...");
  delay(100);

  String result = executeOTAFromURL(url);

  if (result == "Success") {
    Serial.println("OTA Success! Rebooting...");
    ESP.restart();
  } else {
    Serial.println("OTA Failed: " + result);
  }
}

void setupOTA() {
  ArduinoOTA.setHostname("esp32-tartanhacks");
  ArduinoOTA.onStart([]() { Serial.println("Start updating"); })
      .onEnd([]() { Serial.println("\nEnd"); })
      .onProgress([](unsigned int progress, unsigned int total) {
        Serial.printf("Progress: %u%%\r", (progress / (total / 100)));
      })
      .onError([](ota_error_t error) { Serial.printf("Error[%u]: ", error); });

  ArduinoOTA.begin();
}

// --- Main Setup & Loop ---

void setup() {
  Serial.begin(115200);

  // Call user app setup
  userAppSetup();

  // Connect to WiFi
  Serial.println("Connecting to WiFi...");
  WiFi.mode(WIFI_STA);
  WiFi.begin(ssid, password);

  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }

  Serial.println("\nWiFi connected!");
  Serial.print("IP address: ");
  Serial.println(WiFi.localIP());

  setupOTA();

  server.on("/", handleRoot);
  server.on("/led/on", handleLedOn);
  server.on("/led/off", handleLedOff);
  server.on("/led/toggle", handleToggle);
  server.on("/ota/update", HTTP_POST, handleOTAUpdate);
  server.on("/ota/update", HTTP_GET, handleOTAUpdate);
  server.enableCORS(true);
  server.begin();

  Serial.println("HTTP server started");
}

void loop() {
  ArduinoOTA.handle();
  server.handleClient();

  // Delegate loop logic to user app
  userAppLoop();
}
