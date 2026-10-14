import assert from "node:assert/strict";
import { test } from "node:test";
import { newRollingSubscriptionScore } from "./rolling-subscription-score.js";

test("RollingSubscriptionScore starts in idle", () => {
  const item = newRollingSubscriptionScore("code-941", "title-330");
  assert.equal(item.status, "idle", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("RollingSubscriptionScore moves to warming", () => {
  const item = newRollingSubscriptionScore("code-941", "title-330");
  try {
    item.moveTo("warming");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "warming", "status");
});

test("RollingSubscriptionScore rejects moves from stopped", () => {
  const item = newRollingSubscriptionScore("code-941", "title-330");
  item.status = "stopped";
  assert.throws(() => item.moveTo("idle"), Error, "move");
});
