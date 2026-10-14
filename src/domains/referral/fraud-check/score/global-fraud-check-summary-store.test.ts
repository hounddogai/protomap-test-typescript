import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryGlobalFraudCheckSummaryStore } from "./global-fraud-check-summary-store.js";
import { newGlobalFraudCheckSummary } from "./global-fraud-check-summary.js";

test("MemoryGlobalFraudCheckSummaryStore finds what it saved", () => {
  const store = newMemoryGlobalFraudCheckSummaryStore();
  const item = newGlobalFraudCheckSummary("code-200", "label-443");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
