import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultWeightedPayoutPolicyEngine } from "./weighted-payout-policy-engine.js";
import { newWeightedPayoutPolicy } from "./weighted-payout-policy.js";

test("WeightedPayoutPolicyEngine keeps results within bounds", () => {
  const engine = defaultWeightedPayoutPolicyEngine(flags.newRegistry());
  const item = newWeightedPayoutPolicy("code-591", "title-615");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
