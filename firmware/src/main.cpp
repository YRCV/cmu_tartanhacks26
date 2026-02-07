#include <Arduino.h>
#include <WiFi.h>
#include <WebServer.h>

// wifi credentials 
const char* ssid = WIFI_SSID;
const char* password = WIFI_PASSWORD;

const int LED_PIN = 2;  // the built-in led

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

void setup() {
  Serial.begin(115200);
  pinMode(LED_PIN, OUTPUT);
  digitalWrite(LED_PIN, LOW);
  
  // connect to wifi
  Serial.println("Connecting to WiFi...");
  WiFi.begin(ssid, password);
  
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  
  Serial.println("\nWiFi connected!");
  Serial.print("IP address: ");
  Serial.println(WiFi.localIP());
  
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
  server.handleClient();
}