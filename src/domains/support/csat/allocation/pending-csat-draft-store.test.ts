import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryPendingCsatDraftStore } from "./pending-csat-draft-store.js";
import { newPendingCsatDraft } from "./pending-csat-draft.js";

test("MemoryPendingCsatDraftStore finds what it saved", () => {
  const store = newMemoryPendingCsatDraftStore();
  const item = newPendingCsatDraft("code-46", "name-557");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
