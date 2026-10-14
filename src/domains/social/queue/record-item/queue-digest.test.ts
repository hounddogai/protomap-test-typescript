import assert from "node:assert/strict";
import { test } from "node:test";
import { newQueueDigest } from "./queue-digest.js";

test("QueueDigest starts in created", () => {
  const item = newQueueDigest("code-295", "label-183");
  assert.equal(item.status, "created", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("QueueDigest moves to published", () => {
  const item = newQueueDigest("code-295", "label-183");
  try {
    item.moveTo("published");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "published", "status");
});

test("QueueDigest rejects moves from retired", () => {
  const item = newQueueDigest("code-295", "label-183");
  item.status = "retired";
  assert.throws(() => item.moveTo("created"), Error, "move");
});
