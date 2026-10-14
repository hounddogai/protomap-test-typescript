import assert from "node:assert/strict";
import { test } from "node:test";
import { newScheduledTierScore } from "./scheduled-tier-score.js";

test("ScheduledTierScore starts in open", () => {
  const item = newScheduledTierScore("code-661", "label-557");
  assert.equal(item.status, "open", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("ScheduledTierScore moves to in review", () => {
  const item = newScheduledTierScore("code-661", "label-557");
  try {
    item.moveTo("in_review");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "in_review", "status");
});

test("ScheduledTierScore rejects moves from archived", () => {
  const item = newScheduledTierScore("code-661", "label-557");
  item.status = "archived";
  assert.throws(() => item.moveTo("open"), Error, "move");
});
