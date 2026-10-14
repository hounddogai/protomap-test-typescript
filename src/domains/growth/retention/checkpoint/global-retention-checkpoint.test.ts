import assert from "node:assert/strict";
import { test } from "node:test";
import { newGlobalRetentionCheckpoint } from "./global-retention-checkpoint.js";

test("GlobalRetentionCheckpoint starts in draft", () => {
  const item = newGlobalRetentionCheckpoint("code-597", "title-155");
  assert.equal(item.status, "draft", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("GlobalRetentionCheckpoint moves to suspended", () => {
  const item = newGlobalRetentionCheckpoint("code-597", "title-155");
  try {
    item.moveTo("suspended");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "suspended", "status");
});

test("GlobalRetentionCheckpoint rejects moves from closed", () => {
  const item = newGlobalRetentionCheckpoint("code-597", "title-155");
  item.status = "closed";
  assert.throws(() => item.moveTo("draft"), Error, "move");
});
