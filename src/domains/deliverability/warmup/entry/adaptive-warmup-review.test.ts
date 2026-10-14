import assert from "node:assert/strict";
import { test } from "node:test";
import { newAdaptiveWarmupReview } from "./adaptive-warmup-review.js";

test("AdaptiveWarmupReview starts in open", () => {
  const item = newAdaptiveWarmupReview("code-22", "name-489");
  assert.equal(item.status, "open", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("AdaptiveWarmupReview moves to archived", () => {
  const item = newAdaptiveWarmupReview("code-22", "name-489");
  try {
    item.moveTo("archived");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "archived", "status");
});

test("AdaptiveWarmupReview rejects moves from archived", () => {
  const item = newAdaptiveWarmupReview("code-22", "name-489");
  item.status = "archived";
  assert.throws(() => item.moveTo("open"), Error, "move");
});
