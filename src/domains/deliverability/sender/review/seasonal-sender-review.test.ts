import assert from "node:assert/strict";
import { test } from "node:test";
import { newSeasonalSenderReview } from "./seasonal-sender-review.js";

test("SeasonalSenderReview starts in new", () => {
  const item = newSeasonalSenderReview("code-657", "title-968");
  assert.equal(item.status, "new", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("SeasonalSenderReview moves to queued", () => {
  const item = newSeasonalSenderReview("code-657", "title-968");
  try {
    item.moveTo("queued");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "queued", "status");
});

test("SeasonalSenderReview rejects moves from failed", () => {
  const item = newSeasonalSenderReview("code-657", "title-968");
  item.status = "failed";
  assert.throws(() => item.moveTo("new"), Error, "move");
});
