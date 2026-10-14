import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultLenientFrequencyBaselineEngine } from "./lenient-frequency-baseline-engine.js";
import { newLenientFrequencyBaseline } from "./lenient-frequency-baseline.js";

test("LenientFrequencyBaselineEngine keeps results within bounds", () => {
  const engine = defaultLenientFrequencyBaselineEngine(flags.newRegistry());
  const item = newLenientFrequencyBaseline("code-725", "title-751");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
