import assert from "node:assert/strict";
import { test } from "node:test";
import { newOptOutReview } from "./opt-out-review.js";

test("OptOutReview starts in requested", () => {
  const item = newOptOutReview("code-960", "title-557");
  assert.equal(item.status, "requested", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("OptOutReview moves to granted", () => {
  const item = newOptOutReview("code-960", "title-557");
  try {
    item.moveTo("granted");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "granted", "status");
});

test("OptOutReview rejects moves from expired", () => {
  const item = newOptOutReview("code-960", "title-557");
  item.status = "expired";
  assert.throws(() => item.moveTo("requested"), Error, "move");
});
