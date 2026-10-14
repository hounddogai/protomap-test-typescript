import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryBatchedPayoutBaselineStore } from "./batched-payout-baseline-store.js";
import { newBatchedPayoutBaseline } from "./batched-payout-baseline.js";

test("MemoryBatchedPayoutBaselineStore finds what it saved", () => {
  const store = newMemoryBatchedPayoutBaselineStore();
  const item = newBatchedPayoutBaseline("code-837", "label-991");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
