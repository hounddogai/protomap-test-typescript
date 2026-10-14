import assert from "node:assert/strict";
import { test } from "node:test";
import { newPrimaryQueueRollup } from "./primary-queue-rollup.js";

test("PrimaryQueueRollup starts in draft", () => {
  const item = newPrimaryQueueRollup("code-580", "title-442");
  assert.equal(item.status, "draft", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("PrimaryQueueRollup moves to pending", () => {
  const item = newPrimaryQueueRollup("code-580", "title-442");
  try {
    item.moveTo("pending");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "pending", "status");
});

test("PrimaryQueueRollup rejects moves from closed", () => {
  const item = newPrimaryQueueRollup("code-580", "title-442");
  item.status = "closed";
  assert.throws(() => item.moveTo("draft"), Error, "move");
});
