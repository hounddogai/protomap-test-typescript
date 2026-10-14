import assert from "node:assert/strict";
import { test } from "node:test";
import { newGlobalSuppressionCheckpoint } from "./global-suppression-checkpoint.js";

test("GlobalSuppressionCheckpoint starts in draft", () => {
  const item = newGlobalSuppressionCheckpoint("code-673", "title-277");
  assert.equal(item.status, "draft", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("GlobalSuppressionCheckpoint moves to pending", () => {
  const item = newGlobalSuppressionCheckpoint("code-673", "title-277");
  try {
    item.moveTo("pending");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "pending", "status");
});

test("GlobalSuppressionCheckpoint rejects moves from closed", () => {
  const item = newGlobalSuppressionCheckpoint("code-673", "title-277");
  item.status = "closed";
  assert.throws(() => item.moveTo("draft"), Error, "move");
});
