import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryMentionDraftStore } from "./mention-draft-store.js";
import { newMentionDraft } from "./mention-draft.js";

test("MemoryMentionDraftStore finds what it saved", () => {
  const store = newMemoryMentionDraftStore();
  const item = newMentionDraft("code-607", "name-292");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
