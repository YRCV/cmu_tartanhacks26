/*
 * ESP32 LED Blink Firmware
 *
 * This firmware makes an LED blink at 200ms intervals and then turn off for 1000ms.
 *
 * Interpretation: The LED performs a blink cycle (on for 200ms, off for 200ms)
 * and then remains off for an additional 1000ms, repeating the pattern.
 *
 * 200ms intervals refer to the time between state changes in the blink.
 *
 * Includes comments and basic error handling (e.g., ensuring initial state).
 */

#include <Arduino.h>

// Define the LED pin (ESP32 common pin for built-in LED or external)
#define LED_PIN 2

void ai_test_setup() {
  // Initialize the LED pin as output
  if (LED_PIN < 0 || LED_PIN > 39) {
    // Error: Invalid pin number for ESP32
    while (true) {
      // Halt execution if pin is invalid
    }
  }
  pinMode(LED_PIN, OUTPUT);
  
  // Ensure LED is off initially for consistency
  digitalWrite(LED_PIN, LOW);
}

void ai_test_loop() {
  // Turn LED on for 200ms (start of blink)
  digitalWrite(LED_PIN, HIGH);
  delay(200);
  
  // Turn LED off for 200ms (complete blink cycle)
  digitalWrite(LED_PIN, LOW);
  delay(200);
  
  // Then turn off for additional 1000ms (meets spec)
  // LED is already off, so just delay
  delay(1000);
}