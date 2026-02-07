// Arduino sketch for ESP32 to flash "HELLO" in Morse code using the built-in LED
#define LED_BUILTIN 2  // ESP32 default LED pin is GPIO 2
const int UNIT = 100;
const int DOT_DURATION = 100;  // 1 UNIT
const int DASH_DURATION = 300;  // 3 UNIT
const int SYMBOL_PAUSE = 100;  // 1 UNIT between dots and dashes in a letter
const int INTER_LETTER_PAUSE = 300;  // 3 UNIT after each letter
const int INTER_WORD_PAUSE = 700;  // 7 UNIT after the whole word

// Morse code for each letter in "HELLO"
String morse_letters[5] = {"....", ".", ".-..", ".-..", "---"};

void ai_test_setup() {
  // Initialize the built-in LED pin as an output
  pinMode(LED_BUILTIN, OUTPUT);
  // Ensure LED is off initially
  digitalWrite(LED_BUILTIN, LOW);
}

void ai_test_loop() {
  // Loop through each letter in "HELLO"
  for (int let = 0; let < 5; let++) {
    String morse = morse_letters[let];
    // Loop through each symbol in the letter
    for (size_t i = 0; i < morse.length(); i++) {
      // Flash dot or dash
      if (morse[i] == '.') {
        digitalWrite(LED_BUILTIN, HIGH);
        delay(DOT_DURATION);
        digitalWrite(LED_BUILTIN, LOW);
      } else if (morse[i] == '-') {
        digitalWrite(LED_BUILTIN, HIGH);
        delay(DASH_DURATION);
        digitalWrite(LED_BUILTIN, LOW);
      }
      // Pause after symbol (except for last symbol in letter)
      if (i < morse.length() - 1) {
        delay(SYMBOL_PAUSE);
      }
    }
    // Pause between letters
    delay(INTER_LETTER_PAUSE);
  }
  // Pause after the word
  delay(INTER_WORD_PAUSE);
  // The loop repeats to flash "HELLO" forever
}