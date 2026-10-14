import assert from "node:assert/strict";
import { test } from "node:test";
import { newPostReview } from "./post-review.js";

test("PostReview starts in open", () => {
  const item = newPostReview("code-398", "label-307");
  assert.equal(item.status, "open", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("PostReview moves to reopened", () => {
  const item = newPostReview("code-398", "label-307");
  try {
    item.moveTo("reopened");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "reopened", "status");
});

test("PostReview rejects moves from archived", () => {
  const item = newPostReview("code-398", "label-307");
  item.status = "archived";
  assert.throws(() => item.moveTo("open"), Error, "move");
});
