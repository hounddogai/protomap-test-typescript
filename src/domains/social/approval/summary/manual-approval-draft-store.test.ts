import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryManualApprovalDraftStore } from "./manual-approval-draft-store.js";
import { newManualApprovalDraft } from "./manual-approval-draft.js";

test("MemoryManualApprovalDraftStore finds what it saved", () => {
  const store = newMemoryManualApprovalDraftStore();
  const item = newManualApprovalDraft("code-67", "label-256");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
