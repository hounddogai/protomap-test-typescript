import assert from "node:assert/strict";
import { test } from "node:test";
import { newBounceAssignment } from "./bounce-assignment.js";

test("BounceAssignment starts in created", () => {
  const item = newBounceAssignment("code-529", "title-24");
  assert.equal(item.status, "created", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("BounceAssignment moves to validated", () => {
  const item = newBounceAssignment("code-529", "title-24");
  try {
    item.moveTo("validated");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "validated", "status");
});

test("BounceAssignment rejects moves from retired", () => {
  const item = newBounceAssignment("code-529", "title-24");
  item.status = "retired";
  assert.throws(() => item.moveTo("created"), Error, "move");
});
