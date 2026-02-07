#include "ai.h"
#include "ai_vars_gen.h"
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

// Synchronization flags for OTA vs AI loop
volatile bool isUpdating = false; 
volatile bool aiBusy = false;     
volatile bool shouldStop = false; 

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

// handle ota update request (post /ota/update?url=...)
void handleOTAUpdate() {
  server.sendHeader("Access-Control-Allow-Origin", "*");

  if (!server.hasArg("url")) {
    server.send(400, "text/plain", "Missing 'url' parameter");
    return;
  }

  String url = server.arg("url");
  server.send(200, "text/plain", "Starting OTA update from " + url + "...");

  // 1. tell ai to stop
  isUpdating = true;
  shouldStop = true;
  Serial.println("Waiting for AI loop to stop...");

  // 2. wait for ai to finish current step (max 10s)
  unsigned long startWait = millis();
  while (aiBusy && (millis() - startWait < 10000)) {
    delay(10);
  }

  if (aiBusy) {
    Serial.println("Warning: AI loop did not stop in time. Proceeding anyway...");
  } else {
    Serial.println("AI loop stopped. Proceeding with OTA...");
  }

  delay(100);

  // 4. run update
  String result = executeOTAFromURL(url);

  if (result == "Success") {
    Serial.println("OTA Success! Rebooting...");
    ESP.restart();
  } else {
    Serial.println("OTA Failed: " + result);
    isUpdating = false;
    shouldStop = false;
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

void setupOTA() {
  ArduinoOTA.setHostname("esp32-tartanhacks");
  ArduinoOTA.begin();
}

void webServerTask(void *pvParameters) {
  for (;;) {
    server.handleClient();
    ArduinoOTA.handle();
    vTaskDelay(pdMS_TO_TICKS(1));
  }
}

void setup() {
  Serial.begin(115200);

  WiFi.mode(WIFI_STA);
  WiFi.begin(ssid, password);

  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }

  Serial.println("\nWiFi connected! IP: " + WiFi.localIP().toString());

  setupOTA();
  ai_test_setup();

  server.on("/", handleRoot);
  server.on("/ota/update", HTTP_POST, handleOTAUpdate);
  server.on("/ota/update", HTTP_GET, handleOTAUpdate);
  server.on("/changeVar", HTTP_GET, handleChangeVar);

  server.enableCORS(true);
  server.begin();
  Serial.println("HTTP server started"); 

  xTaskCreatePinnedToCore(webServerTask, "WebServerTask", 4096, NULL, 1, NULL, 0);
}

void loop() {
  if (isUpdating) {
    delay(100);
    return;
  }

  aiBusy = true;
  ai_test_loop();
  aiBusy = false;
}
