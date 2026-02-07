#include <Arduino.h>

// Define the LED pin
#define LED_PIN 2

// Define timing constants
const int DOT_DURATION = 200;      // 200ms for dot
const int DASH_DURATION = 600;     // 600ms for dash
const int LETTER_PAUSE = 600;      // 600ms between letters
const int PART_PAUSE = 200;        // 200ms between parts of the same letter

void ai_test_setup() {
  // Initialize the LED pin as an output
  pinMode(LED_PIN, OUTPUT);
  
  // Ensure the LED is off initially
  digitalWrite(LED_PIN, LOW);
}

// Function to flash a dot
void flashDot() {
  digitalWrite(LED_PIN, HIGH);
  delay(DOT_DURATION);
  digitalWrite(LED_PIN, LOW);
  delay(PART_PAUSE);
}

// Function to flash a dash
void flashDash() {
  digitalWrite(LED_PIN, HIGH);
  delay(DASH_DURATION);
  digitalWrite(LED_PIN, LOW);
  delay(PART_PAUSE);
}

// Function to flash a letter's Morse code
void flashLetter(const String& morse) {
  for (char symbol : morse) {
    if (symbol == '.') {
      flashDot();
    } else if (symbol == '-') {
      flashDash();
    } else {
      // Error handling: unknown symbol
      Serial.println("Unknown Morse symbol!");
      break;
    }
  }
  // Pause between letters
  delay(LETTER_PAUSE);
}

void ai_test_loop() {
  // Morse code for each letter in 'hello'
  const String morseH = "....";
  const String morseE = ".";
  const String morseL = ".-..";
  const String morseO = "---";
  
  // Flash each letter
  flashLetter(morseH);
  flashLetter(morseE);
  flashLetter(morseL);
  flashLetter(morseL);
  flashLetter(morseO);
  
  // Optional: Wait before repeating the message (e.g., 2000ms)
  // This is not specified in the spec, but prevents immediate loop
  delay(2000);
}