import assert from "node:assert/strict";
import { test } from "node:test";
import { newPaywallQuota } from "./paywall-quota.js";

test("PaywallQuota starts in requested", () => {
  const item = newPaywallQuota("code-867", "title-601");
  assert.equal(item.status, "requested", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("PaywallQuota moves to granted", () => {
  const item = newPaywallQuota("code-867", "title-601");
  try {
    item.moveTo("granted");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "granted", "status");
});

test("PaywallQuota rejects moves from expired", () => {
  const item = newPaywallQuota("code-867", "title-601");
  item.status = "expired";
  assert.throws(() => item.moveTo("requested"), Error, "move");
});
