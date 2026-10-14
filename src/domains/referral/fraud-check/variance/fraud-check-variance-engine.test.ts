import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultFraudCheckVarianceEngine } from "./fraud-check-variance-engine.js";
import { newFraudCheckVariance } from "./fraud-check-variance.js";

test("FraudCheckVarianceEngine keeps results within bounds", () => {
  const engine = defaultFraudCheckVarianceEngine(flags.newRegistry());
  const item = newFraudCheckVariance("code-367", "label-174");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
