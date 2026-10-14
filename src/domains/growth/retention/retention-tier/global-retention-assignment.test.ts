import assert from "node:assert/strict";
import { test } from "node:test";
import { newGlobalRetentionAssignment } from "./global-retention-assignment.js";

test("GlobalRetentionAssignment starts in draft", () => {
  const item = newGlobalRetentionAssignment("code-777", "title-951");
  assert.equal(item.status, "draft", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("GlobalRetentionAssignment moves to suspended", () => {
  const item = newGlobalRetentionAssignment("code-777", "title-951");
  try {
    item.moveTo("suspended");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "suspended", "status");
});

test("GlobalRetentionAssignment rejects moves from closed", () => {
  const item = newGlobalRetentionAssignment("code-777", "title-951");
  item.status = "closed";
  assert.throws(() => item.moveTo("draft"), Error, "move");
});
