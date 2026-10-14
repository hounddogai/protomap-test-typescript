import assert from "node:assert/strict";
import { test } from "node:test";
import { newPaywallProfile } from "./paywall-profile.js";

test("PaywallProfile starts in new", () => {
  const item = newPaywallProfile("code-454", "title-546");
  assert.equal(item.status, "new", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("PaywallProfile moves to running", () => {
  const item = newPaywallProfile("code-454", "title-546");
  try {
    item.moveTo("running");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "running", "status");
});

test("PaywallProfile rejects moves from failed", () => {
  const item = newPaywallProfile("code-454", "title-546");
  item.status = "failed";
  assert.throws(() => item.moveTo("new"), Error, "move");
});
