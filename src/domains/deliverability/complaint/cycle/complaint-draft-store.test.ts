import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryComplaintDraftStore } from "./complaint-draft-store.js";
import { newComplaintDraft } from "./complaint-draft.js";

test("MemoryComplaintDraftStore finds what it saved", () => {
  const store = newMemoryComplaintDraftStore();
  const item = newComplaintDraft("code-484", "name-261");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
