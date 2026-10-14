import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryLenientRetentionDraftStore } from "./lenient-retention-draft-store.js";
import { newLenientRetentionDraft } from "./lenient-retention-draft.js";

test("MemoryLenientRetentionDraftStore finds what it saved", () => {
  const store = newMemoryLenientRetentionDraftStore();
  const item = newLenientRetentionDraft("code-408", "label-444");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
