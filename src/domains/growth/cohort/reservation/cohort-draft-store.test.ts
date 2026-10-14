import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryCohortDraftStore } from "./cohort-draft-store.js";
import { newCohortDraft } from "./cohort-draft.js";

test("MemoryCohortDraftStore finds what it saved", () => {
  const store = newMemoryCohortDraftStore();
  const item = newCohortDraft("code-348", "title-200");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
