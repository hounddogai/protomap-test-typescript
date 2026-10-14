import assert from "node:assert/strict";
import { test } from "node:test";
import { newPostAssignment } from "./post-assignment.js";

test("PostAssignment starts in created", () => {
  const item = newPostAssignment("code-58", "title-952");
  assert.equal(item.status, "created", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("PostAssignment moves to validated", () => {
  const item = newPostAssignment("code-58", "title-952");
  try {
    item.moveTo("validated");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "validated", "status");
});

test("PostAssignment rejects moves from retired", () => {
  const item = newPostAssignment("code-58", "title-952");
  item.status = "retired";
  assert.throws(() => item.moveTo("created"), Error, "move");
});
