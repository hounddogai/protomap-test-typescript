import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryCohortOverrideStore } from "./cohort-override-store.js";
import { newCohortOverride } from "./cohort-override.js";

test("MemoryCohortOverrideStore finds what it saved", () => {
  const store = newMemoryCohortOverrideStore();
  const item = newCohortOverride("code-455", "name-846");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
