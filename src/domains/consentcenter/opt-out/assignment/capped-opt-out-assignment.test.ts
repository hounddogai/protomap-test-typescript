import assert from "node:assert/strict";
import { test } from "node:test";
import { newCappedOptOutAssignment } from "./capped-opt-out-assignment.js";

test("CappedOptOutAssignment starts in new", () => {
  const item = newCappedOptOutAssignment("code-621", "title-611");
  assert.equal(item.status, "new", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("CappedOptOutAssignment moves to queued", () => {
  const item = newCappedOptOutAssignment("code-621", "title-611");
  try {
    item.moveTo("queued");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "queued", "status");
});

test("CappedOptOutAssignment rejects moves from failed", () => {
  const item = newCappedOptOutAssignment("code-621", "title-611");
  item.status = "failed";
  assert.throws(() => item.moveTo("new"), Error, "move");
});
