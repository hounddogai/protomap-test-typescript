import assert from "node:assert/strict";
import { test } from "node:test";
import { newTieredReplyNotice } from "./tiered-reply-notice.js";

test("TieredReplyNotice starts in new", () => {
  const item = newTieredReplyNotice("code-964", "label-342");
  assert.equal(item.status, "new", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("TieredReplyNotice moves to done", () => {
  const item = newTieredReplyNotice("code-964", "label-342");
  try {
    item.moveTo("done");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "done", "status");
});

test("TieredReplyNotice rejects moves from failed", () => {
  const item = newTieredReplyNotice("code-964", "label-342");
  item.status = "failed";
  assert.throws(() => item.moveTo("new"), Error, "move");
});
