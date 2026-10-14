import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultPaywallClaimEngine } from "./paywall-claim-engine.js";
import { newPaywallClaim } from "./paywall-claim.js";

test("PaywallClaimEngine keeps results within bounds", () => {
  const engine = defaultPaywallClaimEngine();
  const item = newPaywallClaim("code-540", "title-618");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
