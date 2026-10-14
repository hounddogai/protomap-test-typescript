import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultCappedFrequencyBaselineEngine } from "./capped-frequency-baseline-engine.js";
import { newCappedFrequencyBaseline } from "./capped-frequency-baseline.js";

test("CappedFrequencyBaselineEngine keeps results within bounds", () => {
  const engine = defaultCappedFrequencyBaselineEngine(flags.newRegistry());
  const item = newCappedFrequencyBaseline("code-364", "name-523");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
