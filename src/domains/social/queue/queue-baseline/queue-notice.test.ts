import assert from "node:assert/strict";
import { test } from "node:test";
import { newQueueNotice } from "./queue-notice.js";

test("QueueNotice starts in draft", () => {
  const item = newQueueNotice("code-49", "title-453");
  assert.equal(item.status, "draft", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("QueueNotice moves to suspended", () => {
  const item = newQueueNotice("code-49", "title-453");
  try {
    item.moveTo("suspended");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "suspended", "status");
});

test("QueueNotice rejects moves from closed", () => {
  const item = newQueueNotice("code-49", "title-453");
  item.status = "closed";
  assert.throws(() => item.moveTo("draft"), Error, "move");
});
