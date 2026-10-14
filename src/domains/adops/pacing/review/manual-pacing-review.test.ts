import assert from "node:assert/strict";
import { test } from "node:test";
import { newManualPacingReview } from "./manual-pacing-review.js";

test("ManualPacingReview starts in requested", () => {
  const item = newManualPacingReview("code-206", "label-806");
  assert.equal(item.status, "requested", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("ManualPacingReview moves to revoked", () => {
  const item = newManualPacingReview("code-206", "label-806");
  try {
    item.moveTo("revoked");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "revoked", "status");
});

test("ManualPacingReview rejects moves from expired", () => {
  const item = newManualPacingReview("code-206", "label-806");
  item.status = "expired";
  assert.throws(() => item.moveTo("requested"), Error, "move");
});
