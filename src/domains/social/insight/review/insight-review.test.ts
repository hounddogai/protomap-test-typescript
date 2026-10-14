import assert from "node:assert/strict";
import { test } from "node:test";
import { newInsightReview } from "./insight-review.js";

test("InsightReview starts in new", () => {
  const item = newInsightReview("code-626", "title-213");
  assert.equal(item.status, "new", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("InsightReview moves to queued", () => {
  const item = newInsightReview("code-626", "title-213");
  try {
    item.moveTo("queued");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "queued", "status");
});

test("InsightReview rejects moves from failed", () => {
  const item = newInsightReview("code-626", "title-213");
  item.status = "failed";
  assert.throws(() => item.moveTo("new"), Error, "move");
});
