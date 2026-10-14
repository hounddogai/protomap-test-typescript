import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryGlobalCohortEntryStore } from "./global-cohort-entry-store.js";
import { newGlobalCohortEntry } from "./global-cohort-entry.js";

test("MemoryGlobalCohortEntryStore finds what it saved", () => {
  const store = newMemoryGlobalCohortEntryStore();
  const item = newGlobalCohortEntry("code-95", "name-476");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
