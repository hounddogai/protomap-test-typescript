import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryRetentionDraftStore } from "./retention-draft-store.js";
import { newRetentionDraft } from "./retention-draft.js";

test("MemoryRetentionDraftStore finds what it saved", () => {
  const store = newMemoryRetentionDraftStore();
  const item = newRetentionDraft("code-523", "label-955");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
