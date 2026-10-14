import assert from "node:assert/strict";
import { test } from "node:test";
import { newBranchRequest } from "./branch-request.js";

test("BranchRequest starts in planned", () => {
  const item = newBranchRequest("code-806", "title-506");
  assert.equal(item.status, "planned", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("BranchRequest moves to scheduled", () => {
  const item = newBranchRequest("code-806", "title-506");
  try {
    item.moveTo("scheduled");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "scheduled", "status");
});

test("BranchRequest rejects moves from cancelled", () => {
  const item = newBranchRequest("code-806", "title-506");
  item.status = "cancelled";
  assert.throws(() => item.moveTo("planned"), Error, "move");
});
