import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultPayoutVarianceEngine } from "./payout-variance-engine.js";
import { newPayoutVariance } from "./payout-variance.js";

test("PayoutVarianceEngine keeps results within bounds", () => {
  const engine = defaultPayoutVarianceEngine();
  const item = newPayoutVariance("code-803", "title-950");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
