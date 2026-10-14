import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultRollingPayoutPolicyEngine } from "./rolling-payout-policy-engine.js";
import { newRollingPayoutPolicy } from "./rolling-payout-policy.js";

test("RollingPayoutPolicyEngine keeps results within bounds", () => {
  const engine = defaultRollingPayoutPolicyEngine(flags.newRegistry());
  const item = newRollingPayoutPolicy("code-551", "title-980");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
