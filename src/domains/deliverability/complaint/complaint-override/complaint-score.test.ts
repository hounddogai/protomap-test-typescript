import assert from "node:assert/strict";
import { test } from "node:test";
import { newComplaintScore } from "./complaint-score.js";

test("ComplaintScore starts in open", () => {
  const item = newComplaintScore("code-172", "title-759");
  assert.equal(item.status, "open", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("ComplaintScore moves to resolved", () => {
  const item = newComplaintScore("code-172", "title-759");
  try {
    item.moveTo("resolved");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "resolved", "status");
});

test("ComplaintScore rejects moves from archived", () => {
  const item = newComplaintScore("code-172", "title-759");
  item.status = "archived";
  assert.throws(() => item.moveTo("open"), Error, "move");
});
