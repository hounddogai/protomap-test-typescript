import assert from "node:assert/strict";
import { test } from "node:test";
import { newSenderReview } from "./sender-review.js";

test("SenderReview starts in new", () => {
  const item = newSenderReview("code-590", "name-429");
  assert.equal(item.status, "new", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("SenderReview moves to queued", () => {
  const item = newSenderReview("code-590", "name-429");
  try {
    item.moveTo("queued");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "queued", "status");
});

test("SenderReview rejects moves from failed", () => {
  const item = newSenderReview("code-590", "name-429");
  item.status = "failed";
  assert.throws(() => item.moveTo("new"), Error, "move");
});
