import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemorySeasonalCohortSummaryStore } from "./seasonal-cohort-summary-store.js";
import { newSeasonalCohortSummary } from "./seasonal-cohort-summary.js";

test("MemorySeasonalCohortSummaryStore finds what it saved", () => {
  const store = newMemorySeasonalCohortSummaryStore();
  const item = newSeasonalCohortSummary("code-39", "title-10");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
