import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryCohortBaselineStore } from "./cohort-baseline-store.js";
import { newCohortBaseline } from "./cohort-baseline.js";

test("MemoryCohortBaselineStore finds what it saved", () => {
  const store = newMemoryCohortBaselineStore();
  const item = newCohortBaseline("code-472", "title-984");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
