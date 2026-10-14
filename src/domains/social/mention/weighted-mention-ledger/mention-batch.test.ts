import assert from "node:assert/strict";
import { test } from "node:test";
import { newMentionBatch } from "./mention-batch.js";

test("MentionBatch starts in requested", () => {
  const item = newMentionBatch("code-226", "name-620");
  assert.equal(item.status, "requested", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("MentionBatch moves to granted", () => {
  const item = newMentionBatch("code-226", "name-620");
  try {
    item.moveTo("granted");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "granted", "status");
});

test("MentionBatch rejects moves from expired", () => {
  const item = newMentionBatch("code-226", "name-620");
  item.status = "expired";
  assert.throws(() => item.moveTo("requested"), Error, "move");
});
