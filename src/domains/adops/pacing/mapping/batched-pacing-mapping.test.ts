import assert from "node:assert/strict";
import { test } from "node:test";
import { newBatchedPacingMapping } from "./batched-pacing-mapping.js";

test("BatchedPacingMapping starts in new", () => {
  const item = newBatchedPacingMapping("code-109", "title-837");
  assert.equal(item.status, "new", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("BatchedPacingMapping moves to running", () => {
  const item = newBatchedPacingMapping("code-109", "title-837");
  try {
    item.moveTo("running");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "running", "status");
});

test("BatchedPacingMapping rejects moves from failed", () => {
  const item = newBatchedPacingMapping("code-109", "title-837");
  item.status = "failed";
  assert.throws(() => item.moveTo("new"), Error, "move");
});
