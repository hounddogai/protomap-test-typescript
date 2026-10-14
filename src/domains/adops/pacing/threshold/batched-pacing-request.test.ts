import assert from "node:assert/strict";
import { test } from "node:test";
import { newBatchedPacingRequest } from "./batched-pacing-request.js";

test("BatchedPacingRequest starts in open", () => {
  const item = newBatchedPacingRequest("code-378", "label-85");
  assert.equal(item.status, "open", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("BatchedPacingRequest moves to in review", () => {
  const item = newBatchedPacingRequest("code-378", "label-85");
  try {
    item.moveTo("in_review");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "in_review", "status");
});

test("BatchedPacingRequest rejects moves from archived", () => {
  const item = newBatchedPacingRequest("code-378", "label-85");
  item.status = "archived";
  assert.throws(() => item.moveTo("open"), Error, "move");
});
