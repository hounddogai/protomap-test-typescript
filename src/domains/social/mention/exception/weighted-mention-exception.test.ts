import assert from "node:assert/strict";
import { test } from "node:test";
import { newWeightedMentionException } from "./weighted-mention-exception.js";

test("WeightedMentionException starts in new", () => {
  const item = newWeightedMentionException("code-144", "label-926");
  assert.equal(item.status, "new", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("WeightedMentionException moves to queued", () => {
  const item = newWeightedMentionException("code-144", "label-926");
  try {
    item.moveTo("queued");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "queued", "status");
});

test("WeightedMentionException rejects moves from failed", () => {
  const item = newWeightedMentionException("code-144", "label-926");
  item.status = "failed";
  assert.throws(() => item.moveTo("new"), Error, "move");
});
