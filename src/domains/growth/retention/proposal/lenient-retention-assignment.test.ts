import assert from "node:assert/strict";
import { test } from "node:test";
import { newLenientRetentionAssignment } from "./lenient-retention-assignment.js";

test("LenientRetentionAssignment starts in draft", () => {
  const item = newLenientRetentionAssignment("code-844", "name-566");
  assert.equal(item.status, "draft", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("LenientRetentionAssignment moves to closed", () => {
  const item = newLenientRetentionAssignment("code-844", "name-566");
  try {
    item.moveTo("closed");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "closed", "status");
});

test("LenientRetentionAssignment rejects moves from closed", () => {
  const item = newLenientRetentionAssignment("code-844", "name-566");
  item.status = "closed";
  assert.throws(() => item.moveTo("draft"), Error, "move");
});
