import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryStrictFraudCheckSummaryStore } from "./strict-fraud-check-summary-store.js";
import { newStrictFraudCheckSummary } from "./strict-fraud-check-summary.js";

test("MemoryStrictFraudCheckSummaryStore finds what it saved", () => {
  const store = newMemoryStrictFraudCheckSummaryStore();
  const item = newStrictFraudCheckSummary("code-352", "label-414");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
