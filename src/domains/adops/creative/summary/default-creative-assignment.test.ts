import assert from "node:assert/strict";
import { test } from "node:test";
import { newDefaultCreativeAssignment } from "./default-creative-assignment.js";

test("DefaultCreativeAssignment starts in new", () => {
  const item = newDefaultCreativeAssignment("code-314", "label-307");
  assert.equal(item.status, "new", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("DefaultCreativeAssignment moves to failed", () => {
  const item = newDefaultCreativeAssignment("code-314", "label-307");
  try {
    item.moveTo("failed");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "failed", "status");
});

test("DefaultCreativeAssignment rejects moves from failed", () => {
  const item = newDefaultCreativeAssignment("code-314", "label-307");
  item.status = "failed";
  assert.throws(() => item.moveTo("new"), Error, "move");
});
