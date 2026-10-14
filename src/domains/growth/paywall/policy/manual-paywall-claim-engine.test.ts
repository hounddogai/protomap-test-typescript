import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultManualPaywallClaimEngine } from "./manual-paywall-claim-engine.js";
import { newManualPaywallClaim } from "./manual-paywall-claim.js";

test("ManualPaywallClaimEngine keeps results within bounds", () => {
  const engine = defaultManualPaywallClaimEngine();
  const item = newManualPaywallClaim("code-594", "label-746");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
