import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultGlobalFraudCheckClaimEngine } from "./global-fraud-check-claim-engine.js";
import { newGlobalFraudCheckClaim } from "./global-fraud-check-claim.js";

test("GlobalFraudCheckClaimEngine keeps results within bounds", () => {
  const engine = defaultGlobalFraudCheckClaimEngine(flags.newRegistry());
  const item = newGlobalFraudCheckClaim("code-700", "title-128");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
