import assert from "node:assert/strict";
import { test } from "node:test";
import { newLenientModelAssignment } from "./lenient-model-assignment.js";

test("LenientModelAssignment starts in idle", () => {
  const item = newLenientModelAssignment("code-115", "name-90");
  assert.equal(item.status, "idle", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("LenientModelAssignment moves to draining", () => {
  const item = newLenientModelAssignment("code-115", "name-90");
  try {
    item.moveTo("draining");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "draining", "status");
});

test("LenientModelAssignment rejects moves from stopped", () => {
  const item = newLenientModelAssignment("code-115", "name-90");
  item.status = "stopped";
  assert.throws(() => item.moveTo("idle"), Error, "move");
});
