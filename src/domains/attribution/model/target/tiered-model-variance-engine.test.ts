import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultTieredModelVarianceEngine } from "./tiered-model-variance-engine.js";
import { newTieredModelVariance } from "./tiered-model-variance.js";

test("TieredModelVarianceEngine keeps results within bounds", () => {
  const engine = defaultTieredModelVarianceEngine(flags.newRegistry());
  const item = newTieredModelVariance("code-981", "title-208");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
