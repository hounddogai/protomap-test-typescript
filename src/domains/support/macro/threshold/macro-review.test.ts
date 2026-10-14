import assert from "node:assert/strict";
import { test } from "node:test";
import { newMacroReview } from "./macro-review.js";

test("MacroReview starts in new", () => {
  const item = newMacroReview("code-740", "label-499");
  assert.equal(item.status, "new", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("MacroReview moves to failed", () => {
  const item = newMacroReview("code-740", "label-499");
  try {
    item.moveTo("failed");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "failed", "status");
});

test("MacroReview rejects moves from failed", () => {
  const item = newMacroReview("code-740", "label-499");
  item.status = "failed";
  assert.throws(() => item.moveTo("new"), Error, "move");
});
