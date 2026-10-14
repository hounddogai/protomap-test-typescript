import assert from "node:assert/strict";
import { test } from "node:test";
import { newCsatReview } from "./csat-review.js";

test("CsatReview starts in planned", () => {
  const item = newCsatReview("code-583", "label-77");
  assert.equal(item.status, "planned", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("CsatReview moves to in progress", () => {
  const item = newCsatReview("code-583", "label-77");
  try {
    item.moveTo("in_progress");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "in_progress", "status");
});

test("CsatReview rejects moves from cancelled", () => {
  const item = newCsatReview("code-583", "label-77");
  item.status = "cancelled";
  assert.throws(() => item.moveTo("planned"), Error, "move");
});
