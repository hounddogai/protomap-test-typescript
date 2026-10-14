import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultPendingRedemptionPolicyEngine } from "./pending-redemption-policy-engine.js";
import { newPendingRedemptionPolicy } from "./pending-redemption-policy.js";

test("PendingRedemptionPolicyEngine keeps results within bounds", () => {
  const engine = defaultPendingRedemptionPolicyEngine(flags.newRegistry());
  const item = newPendingRedemptionPolicy("code-187", "title-904");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
