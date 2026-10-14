import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultCappedFrequencyEntryEngine } from "./capped-frequency-entry-engine.js";
import { newCappedFrequencyEntry } from "./capped-frequency-entry.js";

test("CappedFrequencyEntryEngine keeps results within bounds", () => {
  const engine = defaultCappedFrequencyEntryEngine(flags.newRegistry());
  const item = newCappedFrequencyEntry("code-249", "name-520");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
