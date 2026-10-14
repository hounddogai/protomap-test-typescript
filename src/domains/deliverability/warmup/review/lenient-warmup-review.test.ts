import assert from "node:assert/strict";
import { test } from "node:test";
import { newLenientWarmupReview } from "./lenient-warmup-review.js";

test("LenientWarmupReview starts in new", () => {
  const item = newLenientWarmupReview("code-662", "label-163");
  assert.equal(item.status, "new", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("LenientWarmupReview moves to queued", () => {
  const item = newLenientWarmupReview("code-662", "label-163");
  try {
    item.moveTo("queued");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "queued", "status");
});

test("LenientWarmupReview rejects moves from failed", () => {
  const item = newLenientWarmupReview("code-662", "label-163");
  item.status = "failed";
  assert.throws(() => item.moveTo("new"), Error, "move");
});
