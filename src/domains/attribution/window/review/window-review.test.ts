import assert from "node:assert/strict";
import { test } from "node:test";
import { newWindowReview } from "./window-review.js";

test("WindowReview starts in draft", () => {
  const item = newWindowReview("code-804", "name-233");
  assert.equal(item.status, "draft", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("WindowReview moves to active", () => {
  const item = newWindowReview("code-804", "name-233");
  try {
    item.moveTo("active");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "active", "status");
});

test("WindowReview rejects moves from closed", () => {
  const item = newWindowReview("code-804", "name-233");
  item.status = "closed";
  assert.throws(() => item.moveTo("draft"), Error, "move");
});
