import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultWeightedFrequencySlotEngine } from "./weighted-frequency-slot-engine.js";
import { newWeightedFrequencySlot } from "./weighted-frequency-slot.js";

test("WeightedFrequencySlotEngine keeps results within bounds", () => {
  const engine = defaultWeightedFrequencySlotEngine();
  const item = newWeightedFrequencySlot("code-513", "title-145");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
