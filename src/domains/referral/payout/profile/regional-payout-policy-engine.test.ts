import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultRegionalPayoutPolicyEngine } from "./regional-payout-policy-engine.js";
import { newRegionalPayoutPolicy } from "./regional-payout-policy.js";

test("RegionalPayoutPolicyEngine keeps results within bounds", () => {
  const engine = defaultRegionalPayoutPolicyEngine(flags.newRegistry());
  const item = newRegionalPayoutPolicy("code-37", "title-113");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
