import assert from "node:assert/strict";
import { test } from "node:test";
import { newPrimaryPaywallTemplate } from "./primary-paywall-template.js";

test("PrimaryPaywallTemplate starts in requested", () => {
  const item = newPrimaryPaywallTemplate("code-930", "name-654");
  assert.equal(item.status, "requested", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("PrimaryPaywallTemplate moves to revoked", () => {
  const item = newPrimaryPaywallTemplate("code-930", "name-654");
  try {
    item.moveTo("revoked");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "revoked", "status");
});

test("PrimaryPaywallTemplate rejects moves from expired", () => {
  const item = newPrimaryPaywallTemplate("code-930", "name-654");
  item.status = "expired";
  assert.throws(() => item.moveTo("requested"), Error, "move");
});
