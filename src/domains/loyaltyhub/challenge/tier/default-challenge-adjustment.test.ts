import assert from "node:assert/strict";
import { test } from "node:test";
import { newDefaultChallengeAdjustment } from "./default-challenge-adjustment.js";

test("DefaultChallengeAdjustment starts in open", () => {
  const item = newDefaultChallengeAdjustment("code-917", "name-639");
  assert.equal(item.status, "open", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("DefaultChallengeAdjustment moves to resolved", () => {
  const item = newDefaultChallengeAdjustment("code-917", "name-639");
  try {
    item.moveTo("resolved");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "resolved", "status");
});

test("DefaultChallengeAdjustment rejects moves from archived", () => {
  const item = newDefaultChallengeAdjustment("code-917", "name-639");
  item.status = "archived";
  assert.throws(() => item.moveTo("open"), Error, "move");
});
