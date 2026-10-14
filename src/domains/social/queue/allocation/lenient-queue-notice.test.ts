import assert from "node:assert/strict";
import { test } from "node:test";
import { newLenientQueueNotice } from "./lenient-queue-notice.js";

test("LenientQueueNotice starts in created", () => {
  const item = newLenientQueueNotice("code-73", "label-354");
  assert.equal(item.status, "created", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("LenientQueueNotice moves to published", () => {
  const item = newLenientQueueNotice("code-73", "label-354");
  try {
    item.moveTo("published");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "published", "status");
});

test("LenientQueueNotice rejects moves from retired", () => {
  const item = newLenientQueueNotice("code-73", "label-354");
  item.status = "retired";
  assert.throws(() => item.moveTo("created"), Error, "move");
});
