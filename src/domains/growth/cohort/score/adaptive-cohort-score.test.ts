import assert from "node:assert/strict";
import { test } from "node:test";
import { newAdaptiveCohortScore } from "./adaptive-cohort-score.js";

test("AdaptiveCohortScore starts in planned", () => {
  const item = newAdaptiveCohortScore("code-88", "label-790");
  assert.equal(item.status, "planned", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("AdaptiveCohortScore moves to scheduled", () => {
  const item = newAdaptiveCohortScore("code-88", "label-790");
  try {
    item.moveTo("scheduled");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "scheduled", "status");
});

test("AdaptiveCohortScore rejects moves from cancelled", () => {
  const item = newAdaptiveCohortScore("code-88", "label-790");
  item.status = "cancelled";
  assert.throws(() => item.moveTo("planned"), Error, "move");
});
