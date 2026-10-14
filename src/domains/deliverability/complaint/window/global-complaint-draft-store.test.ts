import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryGlobalComplaintDraftStore } from "./global-complaint-draft-store.js";
import { newGlobalComplaintDraft } from "./global-complaint-draft.js";

test("MemoryGlobalComplaintDraftStore finds what it saved", () => {
  const store = newMemoryGlobalComplaintDraftStore();
  const item = newGlobalComplaintDraft("code-687", "name-768");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
