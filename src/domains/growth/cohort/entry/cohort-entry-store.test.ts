import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryCohortEntryStore } from "./cohort-entry-store.js";
import { newCohortEntry } from "./cohort-entry.js";

test("MemoryCohortEntryStore finds what it saved", () => {
  const store = newMemoryCohortEntryStore();
  const item = newCohortEntry("code-298", "label-676");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
