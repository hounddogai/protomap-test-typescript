import assert from "node:assert/strict";
import { test } from "node:test";
import { newManualPaywallClaim } from "./manual-paywall-claim.js";

test("ManualPaywallClaim starts in draft", () => {
  const item = newManualPaywallClaim("code-594", "label-746");
  assert.equal(item.status, "draft", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("ManualPaywallClaim moves to active", () => {
  const item = newManualPaywallClaim("code-594", "label-746");
  try {
    item.moveTo("active");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "active", "status");
});

test("ManualPaywallClaim rejects moves from closed", () => {
  const item = newManualPaywallClaim("code-594", "label-746");
  item.status = "closed";
  assert.throws(() => item.moveTo("draft"), Error, "move");
});
