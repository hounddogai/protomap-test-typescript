import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultLegacyFrequencyVarianceEngine } from "./legacy-frequency-variance-engine.js";
import { newLegacyFrequencyVariance } from "./legacy-frequency-variance.js";

test("LegacyFrequencyVarianceEngine keeps results within bounds", () => {
  const engine = defaultLegacyFrequencyVarianceEngine(flags.newRegistry());
  const item = newLegacyFrequencyVariance("code-303", "name-633");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
