import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultPrimaryFraudCheckClaimEngine } from "./primary-fraud-check-claim-engine.js";
import { newPrimaryFraudCheckClaim } from "./primary-fraud-check-claim.js";

test("PrimaryFraudCheckClaimEngine keeps results within bounds", () => {
  const engine = defaultPrimaryFraudCheckClaimEngine(flags.newRegistry());
  const item = newPrimaryFraudCheckClaim("code-624", "label-100");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
