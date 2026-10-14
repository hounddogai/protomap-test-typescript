import assert from "node:assert/strict";
import { test } from "node:test";
import { newLevelReview } from "./level-review.js";

test("LevelReview starts in planned", () => {
  const item = newLevelReview("code-157", "label-118");
  assert.equal(item.status, "planned", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("LevelReview moves to scheduled", () => {
  const item = newLevelReview("code-157", "label-118");
  try {
    item.moveTo("scheduled");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "scheduled", "status");
});

test("LevelReview rejects moves from cancelled", () => {
  const item = newLevelReview("code-157", "label-118");
  item.status = "cancelled";
  assert.throws(() => item.moveTo("planned"), Error, "move");
});
