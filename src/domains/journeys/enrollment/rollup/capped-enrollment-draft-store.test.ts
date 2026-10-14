import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryCappedEnrollmentDraftStore } from "./capped-enrollment-draft-store.js";
import { newCappedEnrollmentDraft } from "./capped-enrollment-draft.js";

test("MemoryCappedEnrollmentDraftStore finds what it saved", () => {
  const store = newMemoryCappedEnrollmentDraftStore();
  const item = newCappedEnrollmentDraft("code-533", "label-3");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
