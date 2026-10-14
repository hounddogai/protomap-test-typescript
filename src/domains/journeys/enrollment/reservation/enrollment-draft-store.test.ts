import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryEnrollmentDraftStore } from "./enrollment-draft-store.js";
import { newEnrollmentDraft } from "./enrollment-draft.js";

test("MemoryEnrollmentDraftStore finds what it saved", () => {
  const store = newMemoryEnrollmentDraftStore();
  const item = newEnrollmentDraft("code-519", "label-842");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
