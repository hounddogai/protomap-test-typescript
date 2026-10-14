import assert from "node:assert/strict";
import { test } from "node:test";
import { newRetentionAssignment } from "./retention-assignment.js";

test("RetentionAssignment starts in planned", () => {
  const item = newRetentionAssignment("code-696", "label-635");
  assert.equal(item.status, "planned", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("RetentionAssignment moves to completed", () => {
  const item = newRetentionAssignment("code-696", "label-635");
  try {
    item.moveTo("completed");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "completed", "status");
});

test("RetentionAssignment rejects moves from cancelled", () => {
  const item = newRetentionAssignment("code-696", "label-635");
  item.status = "cancelled";
  assert.throws(() => item.moveTo("planned"), Error, "move");
});
