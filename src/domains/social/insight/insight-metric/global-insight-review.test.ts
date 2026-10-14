import assert from "node:assert/strict";
import { test } from "node:test";
import { newGlobalInsightReview } from "./global-insight-review.js";

test("GlobalInsightReview starts in draft", () => {
  const item = newGlobalInsightReview("code-325", "label-365");
  assert.equal(item.status, "draft", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("GlobalInsightReview moves to pending", () => {
  const item = newGlobalInsightReview("code-325", "label-365");
  try {
    item.moveTo("pending");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "pending", "status");
});

test("GlobalInsightReview rejects moves from closed", () => {
  const item = newGlobalInsightReview("code-325", "label-365");
  item.status = "closed";
  assert.throws(() => item.moveTo("draft"), Error, "move");
});
