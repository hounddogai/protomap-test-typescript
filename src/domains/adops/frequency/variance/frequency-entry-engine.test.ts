import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultFrequencyEntryEngine } from "./frequency-entry-engine.js";
import { newFrequencyEntry } from "./frequency-entry.js";

test("FrequencyEntryEngine keeps results within bounds", () => {
  const engine = defaultFrequencyEntryEngine();
  const item = newFrequencyEntry("code-426", "label-314");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
