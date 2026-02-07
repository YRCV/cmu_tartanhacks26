/*
  ESP32 Morse Code LED Blinker
  Spec: Make the LED on ESP32 flash 'hello' in Morse code.

  Notes:
  - Uses Arduino framework.
  - Defaults to built-in LED if available; otherwise set LED_PIN.
  - Morse timing:
      dot  = 1 unit
      dash = 3 units
      intra-element gap (within a letter) = 1 unit (LED off)
      inter-letter gap = 3 units (LED off)
      inter-word gap = 7 units (LED off)

  Error handling:
  - Validates the message contains only supported characters (A-Z, 0-9, space).
  - Reports unsupported characters over Serial and skips them.
*/

#include <Arduino.h>

// Change this if your board doesn't define LED_BUILTIN or if you want another GPIO.
#ifndef LED_BUILTIN
  #define LED_BUILTIN 2
#endif

static const int LED_PIN = LED_BUILTIN;

// Base Morse time unit in milliseconds.
static const uint16_t UNIT_MS = 150;

// Message per spec.
static const char *MESSAGE = "hello";

// --- Morse table for A-Z and 0-9 ---
struct MorseMap {
  char c;
  const char *pattern; // '.' and '-'
};

static const MorseMap MORSE_TABLE[] = {
  {'A', ".-"},   {'B', "-..."}, {'C', "-.-."}, {'D', "-.."},  {'E', "."},
  {'F', "..-."}, {'G', "--."},  {'H', "...."}, {'I', ".."},   {'J', ".---"},
  {'K', "-.-"},  {'L', ".-.."}, {'M', "--"},   {'N', "-."},   {'O', "---"},
  {'P', ".--."}, {'Q', "--.-"}, {'R', ".-."},  {'S', "..."},  {'T', "-"},
  {'U', "..-"},  {'V', "...-"}, {'W', ".--"},  {'X', "-..-"}, {'Y', "-.--"},
  {'Z', "--.."},
  {'0', "-----"}, {'1', ".----"}, {'2', "..---"}, {'3', "...--"}, {'4', "....-"},
  {'5', "....."}, {'6', "-...."}, {'7', "--..."}, {'8', "---.."}, {'9', "----."}
};

static const size_t MORSE_TABLE_LEN = sizeof(MORSE_TABLE) / sizeof(MORSE_TABLE[0]);

// --- Utility / error handling ---

// Returns morse pattern for a character, or nullptr if unsupported.
static const char* lookupMorse(char ch) {
  if (ch >= 'a' && ch <= 'z') ch = char(ch - 'a' + 'A');

  for (size_t i = 0; i < MORSE_TABLE_LEN; i++) {
    if (MORSE_TABLE[i].c == ch) return MORSE_TABLE[i].pattern;
  }
  return nullptr;
}

static bool isSupportedChar(char ch) {
  if (ch == ' ') return true;
  if (ch >= 'a' && ch <= 'z') return true;
  if (ch >= 'A' && ch <= 'Z') return true;
  if (ch >= '0' && ch <= '9') return true;
  return false;
}

// LED control wrappers (easy to change to active-low if needed)
static inline void ledOn()  { digitalWrite(LED_PIN, HIGH); }
static inline void ledOff() { digitalWrite(LED_PIN, LOW);  }

// Delay wrapper (allows future non-blocking refactor)
static void waitUnits(uint8_t units) {
  delay((uint32_t)units * UNIT_MS);
}

// Blink one dot or dash.
static void blinkSymbol(char symbol) {
  if (symbol == '.') {
    ledOn();
    waitUnits(1);
    ledOff();
  } else if (symbol == '-') {
    ledOn();
    waitUnits(3);
    ledOff();
  } else {
    // Should never happen because table contains only '.' and '-'
    Serial.printf("[ERR] Invalid Morse symbol '%c'\n", symbol);
    ledOff();
  }
}

// Sends a single letter (A-Z/0-9) in Morse.
static void sendLetter(char ch) {
  const char *pattern = lookupMorse(ch);
  if (!pattern) {
    Serial.printf("[ERR] Unsupported character '%c' (0x%02X), skipping.\n", ch, (unsigned char)ch);
    return;
  }

  // Iterate symbols in the letter.
  for (size_t i = 0; pattern[i] != '\0'; i++) {
    blinkSymbol(pattern[i]);

    // Intra-element gap (1 unit) between symbols, but not after the last symbol.
    if (pattern[i + 1] != '\0') {
      waitUnits(1);
    }
  }
}

// Sends the entire message with correct inter-letter and inter-word spacing.
static void sendMessage(const char *msg) {
  if (!msg) {
    Serial.println("[ERR] Message pointer is null.");
    return;
  }

  const size_t len = strlen(msg);
  if (len == 0) {
    Serial.println("[WARN] Message is empty; nothing to send.");
    return;
  }

  // Validate and warn about unsupported characters.
  for (size_t i = 0; i < len; i++) {
    if (!isSupportedChar(msg[i])) {
      Serial.printf("[WARN] Message contains unsupported character '%c' (0x%02X). It will be skipped.\n",
                    msg[i], (unsigned char)msg[i]);
    }
  }

  for (size_t i = 0; i < len; i++) {
    const char ch = msg[i];

    if (ch == ' ') {
      // Inter-word gap is 7 units OFF.
      // However, if there are multiple spaces, this will insert multiple word gaps.
      ledOff();
      waitUnits(7);
      continue;
    }

    // Send the letter.
    sendLetter(ch);

    // Decide gap to next character.
    // If next char exists and is not a space, inter-letter gap is 3 units OFF.
    // IMPORTANT: We have already ended the letter with LED off and no trailing 1-unit intra-element gap.
    // Standard spacing says total between letters should be 3 units off.
    if (i + 1 < len) {
      if (msg[i + 1] == ' ') {
        // Next is a word boundary; inter-word gap will be handled when we process the space.
        // Add only 0 units here.
      } else {
        ledOff();
        waitUnits(3);
      }
    }
  }
}

void ai_test_setup() {
  Serial.begin(115200);
  delay(50);

  // Basic pin sanity checks.
  if (LED_PIN < 0) {
    Serial.println("[FATAL] LED pin is invalid.");
    // Halt safely.
    while (true) { delay(1000); }
  }

  pinMode(LED_PIN, OUTPUT);
  ledOff();

  Serial.println("ESP32 Morse blinker starting...");
  Serial.printf("LED pin: %d, unit: %u ms, message: '%s'\n", LED_PIN, UNIT_MS, MESSAGE);
}

void ai_test_loop() {
  // Send "hello" in Morse repeatedly.
  sendMessage(MESSAGE);

  // Pause between repetitions (treat as a word gap + extra pause).
  ledOff();
  delay(1000);
}