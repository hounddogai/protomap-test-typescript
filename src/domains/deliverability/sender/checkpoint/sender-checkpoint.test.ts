import assert from "node:assert/strict";
import { test } from "node:test";
import { newSenderCheckpoint } from "./sender-checkpoint.js";

test("SenderCheckpoint starts in draft", () => {
  const item = newSenderCheckpoint("code-342", "name-926");
  assert.equal(item.status, "draft", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("SenderCheckpoint moves to pending", () => {
  const item = newSenderCheckpoint("code-342", "name-926");
  try {
    item.moveTo("pending");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "pending", "status");
});

test("SenderCheckpoint rejects moves from closed", () => {
  const item = newSenderCheckpoint("code-342", "name-926");
  item.status = "closed";
  assert.throws(() => item.moveTo("draft"), Error, "move");
});
