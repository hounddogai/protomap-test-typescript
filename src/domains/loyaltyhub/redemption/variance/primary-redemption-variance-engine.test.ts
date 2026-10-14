import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultPrimaryRedemptionVarianceEngine } from "./primary-redemption-variance-engine.js";
import { newPrimaryRedemptionVariance } from "./primary-redemption-variance.js";

test("PrimaryRedemptionVarianceEngine keeps results within bounds", () => {
  const engine = defaultPrimaryRedemptionVarianceEngine(flags.newRegistry());
  const item = newPrimaryRedemptionVariance("code-7", "name-193");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
