import assert from "node:assert/strict";
import { test } from "node:test";
import { newPaywallPolicy } from "./paywall-policy.js";

test("PaywallPolicy starts in planned", () => {
  const item = newPaywallPolicy("code-804", "name-518");
  assert.equal(item.status, "planned", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("PaywallPolicy moves to scheduled", () => {
  const item = newPaywallPolicy("code-804", "name-518");
  try {
    item.moveTo("scheduled");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "scheduled", "status");
});

test("PaywallPolicy rejects moves from cancelled", () => {
  const item = newPaywallPolicy("code-804", "name-518");
  item.status = "cancelled";
  assert.throws(() => item.moveTo("planned"), Error, "move");
});
