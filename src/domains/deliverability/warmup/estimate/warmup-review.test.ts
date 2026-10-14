import assert from "node:assert/strict";
import { test } from "node:test";
import { newWarmupReview } from "./warmup-review.js";

test("WarmupReview starts in open", () => {
  const item = newWarmupReview("code-181", "title-274");
  assert.equal(item.status, "open", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("WarmupReview moves to archived", () => {
  const item = newWarmupReview("code-181", "title-274");
  try {
    item.moveTo("archived");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "archived", "status");
});

test("WarmupReview rejects moves from archived", () => {
  const item = newWarmupReview("code-181", "title-274");
  item.status = "archived";
  assert.throws(() => item.moveTo("open"), Error, "move");
});
