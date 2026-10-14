import assert from "node:assert/strict";
import { test } from "node:test";
import { newLenientReplyBatch } from "./lenient-reply-batch.js";

test("LenientReplyBatch starts in idle", () => {
  const item = newLenientReplyBatch("code-51", "name-26");
  assert.equal(item.status, "idle", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("LenientReplyBatch moves to warming", () => {
  const item = newLenientReplyBatch("code-51", "name-26");
  try {
    item.moveTo("warming");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "warming", "status");
});

test("LenientReplyBatch rejects moves from stopped", () => {
  const item = newLenientReplyBatch("code-51", "name-26");
  item.status = "stopped";
  assert.throws(() => item.moveTo("idle"), Error, "move");
});
