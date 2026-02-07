#include <Arduino.h>

// Board-specific: LED_BUILTIN is not defined on this board
#ifndef LED_BUILTIN
#define LED_BUILTIN 2
#endif

// Extern flag provided elsewhere in the firmware.
// When set true, this routine should stop as soon as reasonably possible.
extern volatile bool shouldStop;

// --- Configuration constants ---
static constexpr uint8_t  kBlinkCount   = 7;
static constexpr uint32_t kBlinkOnMs    = 80;
static constexpr uint32_t kBlinkOffMs   = 80;
static constexpr uint32_t kHoldOnMs     = 5000;
static constexpr uint32_t kPollStepMs   = 10; // polling granularity for shouldStop

// Helper: delay in small steps so we can periodically check shouldStop.
// Returns false if shouldStop was set during the wait.
static bool delayWithStopCheck(uint32_t totalMs) {
  const uint32_t start = millis();
  while ((millis() - start) < totalMs) {
    if (shouldStop) {
      return false;
    }
    // Small delay to yield CPU and avoid busy-waiting too aggressively
    delay(kPollStepMs);
  }
  return true;
}

// Blinks the built-in LED 7 times quickly (80ms ON, 80ms OFF),
// then holds it ON for 5 seconds.
// Returns immediately if shouldStop becomes true.
void blinkBuiltInPattern() {
  // Periodically check stop before doing anything.
  if (shouldStop) {
    return;
  }

  // Configure GPIO safely.
  pinMode(LED_BUILTIN, OUTPUT);

  // Error handling / safety: ensure a known LED state on entry.
  digitalWrite(LED_BUILTIN, LOW);

  // Blink sequence: 7 times
  for (uint8_t i = 0; i < kBlinkCount; ++i) {
    if (shouldStop) {
      // Put LED in a safe state on stop.
      digitalWrite(LED_BUILTIN, LOW);
      return;
    }

    digitalWrite(LED_BUILTIN, HIGH);
    if (!delayWithStopCheck(kBlinkOnMs)) {
      digitalWrite(LED_BUILTIN, LOW);
      return;
    }

    digitalWrite(LED_BUILTIN, LOW);
    if (!delayWithStopCheck(kBlinkOffMs)) {
      // Already LOW; just return.
      return;
    }
  }

  // Hold ON for 5 seconds
  if (shouldStop) {
    digitalWrite(LED_BUILTIN, LOW);
    return;
  }

  digitalWrite(LED_BUILTIN, HIGH);
  if (!delayWithStopCheck(kHoldOnMs)) {
    // On stop, turn off LED (safe default) and return.
    digitalWrite(LED_BUILTIN, LOW);
    return;
  }

  // Optional: leave LED ON after hold, per spec ("5-second hold ON").
  // If you want it off afterward, uncomment the next line.
  // digitalWrite(LED_BUILTIN, LOW);
}

// Example Arduino entry points (optional).
// You can remove these if your project calls blinkBuiltInPattern() elsewhere.
void ai_test_setup() {
  // Ensure LED pin is initialized even if blinkBuiltInPattern isn't called immediately.
  pinMode(LED_BUILTIN, OUTPUT);
  digitalWrite(LED_BUILTIN, LOW);
}

void ai_test_loop() {
  // Demonstration: run pattern once per loop, but stop if shouldStop is set.
  blinkBuiltInPattern();

  if (shouldStop) {
    // If asked to stop, idle here.
    // In a real application, you might return to a scheduler/task manager.
    digitalWrite(LED_BUILTIN, LOW);
    while (true) {
      delay(100);
    }
  }

  // Small pause between repeats (adjust/remove as needed)
  delay(1000);
}