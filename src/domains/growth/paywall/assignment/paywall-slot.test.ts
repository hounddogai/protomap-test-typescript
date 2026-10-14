import assert from "node:assert/strict";
import { test } from "node:test";
import { newPaywallSlot } from "./paywall-slot.js";

test("PaywallSlot starts in requested", () => {
  const item = newPaywallSlot("code-732", "title-95");
  assert.equal(item.status, "requested", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("PaywallSlot moves to revoked", () => {
  const item = newPaywallSlot("code-732", "title-95");
  try {
    item.moveTo("revoked");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "revoked", "status");
});

test("PaywallSlot rejects moves from expired", () => {
  const item = newPaywallSlot("code-732", "title-95");
  item.status = "expired";
  assert.throws(() => item.moveTo("requested"), Error, "move");
});
