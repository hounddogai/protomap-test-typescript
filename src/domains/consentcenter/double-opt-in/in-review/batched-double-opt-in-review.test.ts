import assert from "node:assert/strict";
import { test } from "node:test";
import { newBatchedDoubleOptInReview } from "./batched-double-opt-in-review.js";

test("BatchedDoubleOptInReview starts in requested", () => {
  const item = newBatchedDoubleOptInReview("code-767", "name-221");
  assert.equal(item.status, "requested", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("BatchedDoubleOptInReview moves to revoked", () => {
  const item = newBatchedDoubleOptInReview("code-767", "name-221");
  try {
    item.moveTo("revoked");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "revoked", "status");
});

test("BatchedDoubleOptInReview rejects moves from expired", () => {
  const item = newBatchedDoubleOptInReview("code-767", "name-221");
  item.status = "expired";
  assert.throws(() => item.moveTo("requested"), Error, "move");
});
