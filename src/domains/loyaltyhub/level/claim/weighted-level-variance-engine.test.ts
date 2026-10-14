import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultWeightedLevelVarianceEngine } from "./weighted-level-variance-engine.js";
import { newWeightedLevelVariance } from "./weighted-level-variance.js";

test("WeightedLevelVarianceEngine keeps results within bounds", () => {
  const engine = defaultWeightedLevelVarianceEngine(flags.newRegistry());
  const item = newWeightedLevelVariance("code-170", "label-517");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
