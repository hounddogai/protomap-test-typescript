import assert from "node:assert/strict";
import { test } from "node:test";
import { newWeightedReplyTarget } from "./weighted-reply-target.js";

test("WeightedReplyTarget starts in draft", () => {
  const item = newWeightedReplyTarget("code-671", "name-610");
  assert.equal(item.status, "draft", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("WeightedReplyTarget moves to pending", () => {
  const item = newWeightedReplyTarget("code-671", "name-610");
  try {
    item.moveTo("pending");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "pending", "status");
});

test("WeightedReplyTarget rejects moves from closed", () => {
  const item = newWeightedReplyTarget("code-671", "name-610");
  item.status = "closed";
  assert.throws(() => item.moveTo("draft"), Error, "move");
});
