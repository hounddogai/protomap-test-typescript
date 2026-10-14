import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemorySeasonalCohortRollupStore } from "./seasonal-cohort-rollup-store.js";
import { newSeasonalCohortRollup } from "./seasonal-cohort-rollup.js";

test("MemorySeasonalCohortRollupStore finds what it saved", () => {
  const store = newMemorySeasonalCohortRollupStore();
  const item = newSeasonalCohortRollup("code-45", "name-497");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
