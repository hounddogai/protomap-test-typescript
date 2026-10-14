import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryCohortRollupStore } from "./cohort-rollup-store.js";
import { newCohortRollup } from "./cohort-rollup.js";

test("MemoryCohortRollupStore finds what it saved", () => {
  const store = newMemoryCohortRollupStore();
  const item = newCohortRollup("code-760", "title-281");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
