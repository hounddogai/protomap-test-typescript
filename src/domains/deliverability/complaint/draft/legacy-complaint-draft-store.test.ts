import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryLegacyComplaintDraftStore } from "./legacy-complaint-draft-store.js";
import { newLegacyComplaintDraft } from "./legacy-complaint-draft.js";

test("MemoryLegacyComplaintDraftStore finds what it saved", () => {
  const store = newMemoryLegacyComplaintDraftStore();
  const item = newLegacyComplaintDraft("code-925", "title-56");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
