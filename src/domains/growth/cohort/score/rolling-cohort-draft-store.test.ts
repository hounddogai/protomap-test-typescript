import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryRollingCohortDraftStore } from "./rolling-cohort-draft-store.js";
import { newRollingCohortDraft } from "./rolling-cohort-draft.js";

test("MemoryRollingCohortDraftStore finds what it saved", () => {
  const store = newMemoryRollingCohortDraftStore();
  const item = newRollingCohortDraft("code-607", "name-825");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
