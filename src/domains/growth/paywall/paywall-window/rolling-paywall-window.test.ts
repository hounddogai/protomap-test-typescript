import assert from "node:assert/strict";
import { test } from "node:test";
import { newRollingPaywallWindow } from "./rolling-paywall-window.js";

test("RollingPaywallWindow starts in created", () => {
  const item = newRollingPaywallWindow("code-539", "label-806");
  assert.equal(item.status, "created", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("RollingPaywallWindow moves to validated", () => {
  const item = newRollingPaywallWindow("code-539", "label-806");
  try {
    item.moveTo("validated");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "validated", "status");
});

test("RollingPaywallWindow rejects moves from retired", () => {
  const item = newRollingPaywallWindow("code-539", "label-806");
  item.status = "retired";
  assert.throws(() => item.moveTo("created"), Error, "move");
});
