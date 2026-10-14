import assert from "node:assert/strict";
import { test } from "node:test";
import { newWeightedEnrollmentSlot } from "./weighted-enrollment-slot.js";

test("WeightedEnrollmentSlot starts in new", () => {
  const item = newWeightedEnrollmentSlot("code-204", "title-774");
  assert.equal(item.status, "new", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("WeightedEnrollmentSlot moves to queued", () => {
  const item = newWeightedEnrollmentSlot("code-204", "title-774");
  try {
    item.moveTo("queued");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "queued", "status");
});

test("WeightedEnrollmentSlot rejects moves from failed", () => {
  const item = newWeightedEnrollmentSlot("code-204", "title-774");
  item.status = "failed";
  assert.throws(() => item.moveTo("new"), Error, "move");
});
