import assert from "node:assert/strict";
import { test } from "node:test";
import { newSeasonalInsightReview } from "./seasonal-insight-review.js";

test("SeasonalInsightReview starts in new", () => {
  const item = newSeasonalInsightReview("code-676", "label-900");
  assert.equal(item.status, "new", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("SeasonalInsightReview moves to queued", () => {
  const item = newSeasonalInsightReview("code-676", "label-900");
  try {
    item.moveTo("queued");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "queued", "status");
});

test("SeasonalInsightReview rejects moves from failed", () => {
  const item = newSeasonalInsightReview("code-676", "label-900");
  item.status = "failed";
  assert.throws(() => item.moveTo("new"), Error, "move");
});
