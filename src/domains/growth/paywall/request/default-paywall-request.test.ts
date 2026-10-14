import assert from "node:assert/strict";
import { test } from "node:test";
import { newDefaultPaywallRequest } from "./default-paywall-request.js";

test("DefaultPaywallRequest starts in requested", () => {
  const item = newDefaultPaywallRequest("code-775", "name-281");
  assert.equal(item.status, "requested", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("DefaultPaywallRequest moves to granted", () => {
  const item = newDefaultPaywallRequest("code-775", "name-281");
  try {
    item.moveTo("granted");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "granted", "status");
});

test("DefaultPaywallRequest rejects moves from expired", () => {
  const item = newDefaultPaywallRequest("code-775", "name-281");
  item.status = "expired";
  assert.throws(() => item.moveTo("requested"), Error, "move");
});
