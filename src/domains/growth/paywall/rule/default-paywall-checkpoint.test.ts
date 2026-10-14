import assert from "node:assert/strict";
import { test } from "node:test";
import { newDefaultPaywallCheckpoint } from "./default-paywall-checkpoint.js";

test("DefaultPaywallCheckpoint starts in open", () => {
  const item = newDefaultPaywallCheckpoint("code-642", "name-734");
  assert.equal(item.status, "open", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("DefaultPaywallCheckpoint moves to resolved", () => {
  const item = newDefaultPaywallCheckpoint("code-642", "name-734");
  try {
    item.moveTo("resolved");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "resolved", "status");
});

test("DefaultPaywallCheckpoint rejects moves from archived", () => {
  const item = newDefaultPaywallCheckpoint("code-642", "name-734");
  item.status = "archived";
  assert.throws(() => item.moveTo("open"), Error, "move");
});
