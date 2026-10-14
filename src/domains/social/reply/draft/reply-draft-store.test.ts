import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryReplyDraftStore } from "./reply-draft-store.js";
import { newReplyDraft } from "./reply-draft.js";

test("MemoryReplyDraftStore finds what it saved", () => {
  const store = newMemoryReplyDraftStore();
  const item = newReplyDraft("code-996", "label-835");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
