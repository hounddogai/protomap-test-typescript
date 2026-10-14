import assert from "node:assert/strict";
import { test } from "node:test";
import { newSlaReview } from "./sla-review.js";

test("SlaReview starts in planned", () => {
  const item = newSlaReview("code-159", "label-951");
  assert.equal(item.status, "planned", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("SlaReview moves to scheduled", () => {
  const item = newSlaReview("code-159", "label-951");
  try {
    item.moveTo("scheduled");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "scheduled", "status");
});

test("SlaReview rejects moves from cancelled", () => {
  const item = newSlaReview("code-159", "label-951");
  item.status = "cancelled";
  assert.throws(() => item.moveTo("planned"), Error, "move");
});
