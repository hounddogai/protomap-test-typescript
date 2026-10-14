import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryPayoutSummaryStore } from "./payout-summary-store.js";
import { newPayoutSummary } from "./payout-summary.js";

test("MemoryPayoutSummaryStore finds what it saved", () => {
  const store = newMemoryPayoutSummaryStore();
  const item = newPayoutSummary("code-928", "name-888");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
