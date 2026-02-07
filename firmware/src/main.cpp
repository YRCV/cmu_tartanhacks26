#include <Arduino.h>
#include <ArduinoOTA.h>
#include <ESPmDNS.h>
#include <HTTPClient.h>
#include <Update.h>
#include <WebServer.h>
#include <WiFi.h>
#include <WiFiUdp.h>
#include "ai.h"

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

// Handle OTA update request (POST /ota/update?url=...)
void handleOTAUpdate() {
  server.sendHeader("Access-Control-Allow-Origin", "*");

  if (!server.hasArg("url")) {
    server.send(400, "text/plain", "Missing 'url' parameter");
    return;
  }

  String url = server.arg("url");
  server.send(200, "text/plain", "Starting OTA update from " + url + "...");

  // Give time for response to be sent
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

  // allow cors for all routes
  server.enableCORS(true);

  server.begin();
  Serial.println("HTTP server started"); 

  // Create the web server task running on Core 0
  // loop() runs on Core 1 by default
  xTaskCreatePinnedToCore(
    webServerTask,    // Task function
    "WebServerTask",  // Task name
    4096,             // Stack size (bytes)
    NULL,             // Parameters
    1,                // Priority
    NULL,             // Task handle
    0                 // Core 0
  );
}

void loop() {
  // Since server.handleClient() is now in a task, ai_test_loop() 
  // can block here without affecting the web server.
  ai_test_loop();
}
