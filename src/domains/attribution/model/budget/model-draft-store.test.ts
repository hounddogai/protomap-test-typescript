import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryModelDraftStore } from "./model-draft-store.js";
import { newModelDraft } from "./model-draft.js";

test("MemoryModelDraftStore finds what it saved", () => {
  const store = newMemoryModelDraftStore();
  const item = newModelDraft("code-98", "title-23");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
