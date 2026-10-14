import assert from "node:assert/strict";
import { test } from "node:test";
import { newReplyDraft } from "./reply-draft.js";

test("ReplyDraft starts in proposed", () => {
  const item = newReplyDraft("code-996", "label-835");
  assert.equal(item.status, "proposed", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("ReplyDraft moves to approved", () => {
  const item = newReplyDraft("code-996", "label-835");
  try {
    item.moveTo("approved");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "approved", "status");
});

test("ReplyDraft rejects moves from withdrawn", () => {
  const item = newReplyDraft("code-996", "label-835");
  item.status = "withdrawn";
  assert.throws(() => item.moveTo("proposed"), Error, "move");
});
