import assert from "node:assert/strict";
import { test } from "node:test";
import { newLenientRewardScore } from "./lenient-reward-score.js";

test("LenientRewardScore starts in open", () => {
  const item = newLenientRewardScore("code-128", "title-914");
  assert.equal(item.status, "open", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("LenientRewardScore moves to in review", () => {
  const item = newLenientRewardScore("code-128", "title-914");
  try {
    item.moveTo("in_review");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "in_review", "status");
});

test("LenientRewardScore rejects moves from archived", () => {
  const item = newLenientRewardScore("code-128", "title-914");
  item.status = "archived";
  assert.throws(() => item.moveTo("open"), Error, "move");
});
