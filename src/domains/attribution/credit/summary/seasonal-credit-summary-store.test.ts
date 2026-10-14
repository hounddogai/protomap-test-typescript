import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemorySeasonalCreditSummaryStore } from "./seasonal-credit-summary-store.js";
import { newSeasonalCreditSummary } from "./seasonal-credit-summary.js";

test("MemorySeasonalCreditSummaryStore finds what it saved", () => {
  const store = newMemorySeasonalCreditSummaryStore();
  const item = newSeasonalCreditSummary("code-813", "title-437");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
