import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryApprovalDraftStore } from "./approval-draft-store.js";
import { newApprovalDraft } from "./approval-draft.js";

test("MemoryApprovalDraftStore finds what it saved", () => {
  const store = newMemoryApprovalDraftStore();
  const item = newApprovalDraft("code-314", "title-987");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
