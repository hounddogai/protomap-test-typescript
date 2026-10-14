import assert from "node:assert/strict";
import { test } from "node:test";
import { newNudgeScore } from "./nudge-score.js";

test("NudgeScore starts in new", () => {
  const item = newNudgeScore("code-323", "title-330");
  assert.equal(item.status, "new", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("NudgeScore moves to failed", () => {
  const item = newNudgeScore("code-323", "title-330");
  try {
    item.moveTo("failed");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "failed", "status");
});

test("NudgeScore rejects moves from failed", () => {
  const item = newNudgeScore("code-323", "title-330");
  item.status = "failed";
  assert.throws(() => item.moveTo("new"), Error, "move");
});
