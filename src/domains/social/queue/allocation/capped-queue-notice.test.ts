import assert from "node:assert/strict";
import { test } from "node:test";
import { newCappedQueueNotice } from "./capped-queue-notice.js";

test("CappedQueueNotice starts in open", () => {
  const item = newCappedQueueNotice("code-187", "label-687");
  assert.equal(item.status, "open", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("CappedQueueNotice moves to reopened", () => {
  const item = newCappedQueueNotice("code-187", "label-687");
  try {
    item.moveTo("reopened");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "reopened", "status");
});

test("CappedQueueNotice rejects moves from archived", () => {
  const item = newCappedQueueNotice("code-187", "label-687");
  item.status = "archived";
  assert.throws(() => item.moveTo("open"), Error, "move");
});
