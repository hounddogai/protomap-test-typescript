import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryStrictCohortDraftStore } from "./strict-cohort-draft-store.js";
import { newStrictCohortDraft } from "./strict-cohort-draft.js";

test("MemoryStrictCohortDraftStore finds what it saved", () => {
  const store = newMemoryStrictCohortDraftStore();
  const item = newStrictCohortDraft("code-765", "label-179");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
