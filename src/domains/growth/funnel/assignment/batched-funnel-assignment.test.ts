import assert from "node:assert/strict";
import { test } from "node:test";
import { newBatchedFunnelAssignment } from "./batched-funnel-assignment.js";

test("BatchedFunnelAssignment starts in created", () => {
  const item = newBatchedFunnelAssignment("code-778", "title-707");
  assert.equal(item.status, "created", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("BatchedFunnelAssignment moves to validated", () => {
  const item = newBatchedFunnelAssignment("code-778", "title-707");
  try {
    item.moveTo("validated");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "validated", "status");
});

test("BatchedFunnelAssignment rejects moves from retired", () => {
  const item = newBatchedFunnelAssignment("code-778", "title-707");
  item.status = "retired";
  assert.throws(() => item.moveTo("created"), Error, "move");
});
