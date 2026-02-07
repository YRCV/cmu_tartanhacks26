#include "ai.h"
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

WebServer server(80);

// handle root (return)
void handleRoot() {
  server.sendHeader("Access-Control-Allow-Origin", "*");
  String message = "ESP32 is running!\n";
  server.send(200, "text/plain", message);
}

// Execute OTA update from a URL
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

// Synchronization flags for OTA vs AI loop
// --- sync flags ---
volatile bool isUpdating = false; // "pause ai for update"
volatile bool aiBusy = false;     // "ai is busy working"
volatile bool shouldStop = false; // "stop everything now"

// handle ota update request (post /ota/update?url=...)
void handleOTAUpdate() {
  server.sendHeader("Access-Control-Allow-Origin", "*");

  if (!server.hasArg("url")) {
    server.send(400, "text/plain", "Missing 'url' parameter");
    return;
  }

  String url = server.arg("url");
  server.send(200, "text/plain", "Starting Ota update from " + url + "...");

  // 1. tell ai to stop
  isUpdating = true;
  shouldStop = true;
  Serial.println("Waiting for AI loop to stop...");

  // 2. wait for ai to finish current step
  // wait up to 10s, otherwise force it
  unsigned long startWait = millis();
  while (aiBusy && (millis() - startWait < 10000)) {
    delay(10);
  }

  // 3. check if stopped
  if (aiBusy) {
    Serial.println(
        "Warning: AI loop did not stop in time. Proceeding anyway...");
  } else {
    Serial.println("AI loop stopped. Proceeding with OTA...");
  }

  // give time for web response
  delay(100);

  // 4. run update
  String result = executeOTAFromURL(url);

  if (result == "Success") {
    Serial.println("OTA Success! Rebooting...");
    ESP.restart();
  } else {
    Serial.println("OTA Failed: " + result);
    // resume ai loop if OTA failed
    isUpdating = false;
    shouldStop = false;
  }
}

// ... existing setupOTA/webServerTask/setup ...

void loop() {
  // Check if OTA is requested relative to core synchronization
  if (isUpdating) {
    delay(100);
    return;
  }

  // Mark AI as busy
  aiBusy = true;

  // Since server.handleClient() is now in a task, ai_test_loop()
  // can block here without affecting the web server.
  ai_test_loop();

  // Mark AI as not busy
  aiBusy = false;
}

void setupOTA() {
  ArduinoOTA.setHostname("esp32-tartanhacks");

  ArduinoOTA
      .onStart([]() {
        String type;
        if (ArduinoOTA.getCommand() == U_FLASH)
          type = "sketch";
        else // U_SPIFFS
          type = "filesystem";

        Serial.println("Start updating " + type);
      })
      .onEnd([]() { Serial.println("\nEnd"); })
      .onProgress([](unsigned int progress, unsigned int total) {
        Serial.printf("Progress: %u%%\r", (progress / (total / 100)));
      })
      .onError([](ota_error_t error) {
        Serial.printf("Error[%u]: ", error);
        if (error == OTA_AUTH_ERROR)
          Serial.println("Auth Failed");
        else if (error == OTA_BEGIN_ERROR)
          Serial.println("Begin Failed");
        else if (error == OTA_CONNECT_ERROR)
          Serial.println("Connect Failed");
        else if (error == OTA_RECEIVE_ERROR)
          Serial.println("Receive Failed");
        else if (error == OTA_END_ERROR)
          Serial.println("End Failed");
      });

  ArduinoOTA.begin();
}

// Task for handling web server and OTA updates independently
void webServerTask(void *pvParameters) {
  for (;;) {
    server.handleClient();
    ArduinoOTA.handle();
    // Yield to let other tasks run and feed the watchdog
    vTaskDelay(pdMS_TO_TICKS(1));
  }
}

// Handle variable changes dynamically via query params
void handleChangeVar() {
  server.sendHeader("Access-Control-Allow-Origin", "*");
  String response = "Update status:\n";
  
  for (int i = 0; i < server.args(); i++) {
    String name = server.argName(i);
    String value = server.arg(i);
    
    if (updateVariableGeneric(name, value)) {
      response += " - " + name + " updated successfully\n";
    } else {
      response += " - " + name + " FAILED (not found or type mismatch)\n";
    }
  }

  server.send(200, "text/plain", response);
}

void setup() {
  Serial.begin(115200);

  // connect to wifi
  Serial.println("Connecting to WiFi...");
  WiFi.mode(WIFI_STA); // Explicitly set station mode
  WiFi.begin(ssid, password);

  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }

  Serial.println("\nWiFi connected!");
  Serial.print("IP address: ");
  Serial.println(WiFi.localIP());

  // Setup OTA
  setupOTA();

  // Initialize AI functions
  ai_test_setup();

  // establish the http routes
  server.on("/", handleRoot);
  server.on("/ota/update", HTTP_POST, handleOTAUpdate);
  server.on("/ota/update", HTTP_GET, handleOTAUpdate);
  server.on("/changeVar", HTTP_GET, handleChangeVar);

  // allow cors for all routes
  server.enableCORS(true);

  server.begin();
  Serial.println("HTTP server started"); 

  // Create the web server task running on Core 0
  // loop() runs on Core 1 by default
  xTaskCreatePinnedToCore(webServerTask,   // Task function
                          "WebServerTask", // Task name
                          4096,            // Stack size (bytes)
                          NULL,            // Parameters
                          1,               // Priority
                          NULL,            // Task handle
                          0                // Core 0
  );
}
