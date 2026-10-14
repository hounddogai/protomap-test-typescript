import assert from "node:assert/strict";
import { test } from "node:test";
import { newScheduledChallengeWindow } from "./scheduled-challenge-window.js";

test("ScheduledChallengeWindow starts in created", () => {
  const item = newScheduledChallengeWindow("code-31", "title-758");
  assert.equal(item.status, "created", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("ScheduledChallengeWindow moves to retired", () => {
  const item = newScheduledChallengeWindow("code-31", "title-758");
  try {
    item.moveTo("retired");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "retired", "status");
});

test("ScheduledChallengeWindow rejects moves from retired", () => {
  const item = newScheduledChallengeWindow("code-31", "title-758");
  item.status = "retired";
  assert.throws(() => item.moveTo("created"), Error, "move");
});
