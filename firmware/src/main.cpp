#include <Arduino.h>
#include <ArduinoOTA.h>
#include <ESPmDNS.h>
#include <WebServer.h>
#include <WiFi.h>
#include <WiFiUdp.h>


// wifi credentials
const char *ssid = WIFI_SSID;
const char *password = WIFI_PASSWORD;

const int LED_PIN = 2; // the built-in led

WebServer server(80);

// handle led on
void handleLedOn() {
  digitalWrite(LED_PIN, HIGH);
  server.sendHeader("Access-Control-Allow-Origin", "*");
  server.send(200, "text/plain", "LED ON");
  Serial.println("LED turned ON");
}

// handle led off
void handleLedOff() {
  digitalWrite(LED_PIN, LOW);
  server.sendHeader("Access-Control-Allow-Origin", "*");
  server.send(200, "text/plain", "LED OFF");
  Serial.println("LED turned OFF");
}

// handle led toggle
void handleToggle() {
  digitalWrite(LED_PIN, !digitalRead(LED_PIN));
  server.sendHeader("Access-Control-Allow-Origin", "*");
  server.send(200, "text/plain", digitalRead(LED_PIN) ? "LED ON" : "LED OFF");
  Serial.println("LED toggled");
}

// handle root (return)
void handleRoot() {
  server.sendHeader("Access-Control-Allow-Origin", "*");
  String message = "ESP32 is running!\n";
  message += "LED Status: ";
  message += digitalRead(LED_PIN) ? "ON" : "OFF";
  server.send(200, "text/plain", message);
}

void setupOTA() {
  ArduinoOTA.setHostname("esp32-tartanhacks");

  // No authentication by default
  // ArduinoOTA.setPassword("password");

  // Password can be set with it's md5 value as well


  ArduinoOTA
      .onStart([]() {
        String type;
        if (ArduinoOTA.getCommand() == U_FLASH)
          type = "sketch";
        else // U_SPIFFS
          type = "filesystem";

        // NOTE: if updating SPIFFS this would be the place to unmount SPIFFS
        // using SPIFFS.end()
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

void setup() {
  Serial.begin(115200);
  pinMode(LED_PIN, OUTPUT);
  digitalWrite(LED_PIN, LOW);

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

  // establish the http routes
  server.on("/", handleRoot);
  server.on("/led/on", handleLedOn);
  server.on("/led/off", handleLedOff);
  server.on("/led/toggle", handleToggle);

  // allow cors for all routes
  server.enableCORS(true);

  server.begin();
  Serial.println("HTTP server started");
}

void loop() {
  ArduinoOTA.handle();
  server.handleClient();
}