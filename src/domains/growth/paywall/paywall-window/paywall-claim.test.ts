import assert from "node:assert/strict";
import { test } from "node:test";
import { newPaywallClaim } from "./paywall-claim.js";

test("PaywallClaim starts in proposed", () => {
  const item = newPaywallClaim("code-540", "title-618");
  assert.equal(item.status, "proposed", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("PaywallClaim moves to approved", () => {
  const item = newPaywallClaim("code-540", "title-618");
  try {
    item.moveTo("approved");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "approved", "status");
});

test("PaywallClaim rejects moves from withdrawn", () => {
  const item = newPaywallClaim("code-540", "title-618");
  item.status = "withdrawn";
  assert.throws(() => item.moveTo("proposed"), Error, "move");
});
