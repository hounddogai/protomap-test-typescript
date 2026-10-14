import assert from "node:assert/strict";
import { test } from "node:test";
import { newModelAssignment } from "./model-assignment.js";

test("ModelAssignment starts in proposed", () => {
  const item = newModelAssignment("code-28", "label-61");
  assert.equal(item.status, "proposed", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("ModelAssignment moves to rejected", () => {
  const item = newModelAssignment("code-28", "label-61");
  try {
    item.moveTo("rejected");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "rejected", "status");
});

test("ModelAssignment rejects moves from withdrawn", () => {
  const item = newModelAssignment("code-28", "label-61");
  item.status = "withdrawn";
  assert.throws(() => item.moveTo("proposed"), Error, "move");
});
