import assert from "node:assert/strict";
import { test } from "node:test";
import { newScheduledPostScore } from "./scheduled-post-score.js";

test("ScheduledPostScore starts in open", () => {
  const item = newScheduledPostScore("code-320", "title-815");
  assert.equal(item.status, "open", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("ScheduledPostScore moves to in review", () => {
  const item = newScheduledPostScore("code-320", "title-815");
  try {
    item.moveTo("in_review");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "in_review", "status");
});

test("ScheduledPostScore rejects moves from archived", () => {
  const item = newScheduledPostScore("code-320", "title-815");
  item.status = "archived";
  assert.throws(() => item.moveTo("open"), Error, "move");
});
