import assert from "node:assert/strict";
import { test } from "node:test";
import { newLegacyPostReview } from "./legacy-post-review.js";

test("LegacyPostReview starts in new", () => {
  const item = newLegacyPostReview("code-24", "title-950");
  assert.equal(item.status, "new", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("LegacyPostReview moves to queued", () => {
  const item = newLegacyPostReview("code-24", "title-950");
  try {
    item.moveTo("queued");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "queued", "status");
});

test("LegacyPostReview rejects moves from failed", () => {
  const item = newLegacyPostReview("code-24", "title-950");
  item.status = "failed";
  assert.throws(() => item.moveTo("new"), Error, "move");
});
