import assert from "node:assert/strict";
import { test } from "node:test";
import { newSenderNotice } from "./sender-notice.js";

test("SenderNotice starts in draft", () => {
  const item = newSenderNotice("code-884", "title-99");
  assert.equal(item.status, "draft", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("SenderNotice moves to suspended", () => {
  const item = newSenderNotice("code-884", "title-99");
  try {
    item.moveTo("suspended");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "suspended", "status");
});

test("SenderNotice rejects moves from closed", () => {
  const item = newSenderNotice("code-884", "title-99");
  item.status = "closed";
  assert.throws(() => item.moveTo("draft"), Error, "move");
});
