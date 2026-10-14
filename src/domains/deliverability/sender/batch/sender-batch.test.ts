import assert from "node:assert/strict";
import { test } from "node:test";
import { newSenderBatch } from "./sender-batch.js";

test("SenderBatch starts in draft", () => {
  const item = newSenderBatch("code-347", "label-48");
  assert.equal(item.status, "draft", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("SenderBatch moves to suspended", () => {
  const item = newSenderBatch("code-347", "label-48");
  try {
    item.moveTo("suspended");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "suspended", "status");
});

test("SenderBatch rejects moves from closed", () => {
  const item = newSenderBatch("code-347", "label-48");
  item.status = "closed";
  assert.throws(() => item.moveTo("draft"), Error, "move");
});
