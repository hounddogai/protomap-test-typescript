import assert from "node:assert/strict";
import { test } from "node:test";
import { newRollingRedemptionScore } from "./rolling-redemption-score.js";

test("RollingRedemptionScore starts in idle", () => {
  const item = newRollingRedemptionScore("code-596", "title-471");
  assert.equal(item.status, "idle", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("RollingRedemptionScore moves to warming", () => {
  const item = newRollingRedemptionScore("code-596", "title-471");
  try {
    item.moveTo("warming");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "warming", "status");
});

test("RollingRedemptionScore rejects moves from stopped", () => {
  const item = newRollingRedemptionScore("code-596", "title-471");
  item.status = "stopped";
  assert.throws(() => item.moveTo("idle"), Error, "move");
});
