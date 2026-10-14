import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryPayoutEstimateStore } from "./payout-estimate-store.js";
import { newPayoutEstimate } from "./payout-estimate.js";

test("MemoryPayoutEstimateStore finds what it saved", () => {
  const store = newMemoryPayoutEstimateStore();
  const item = newPayoutEstimate("code-267", "name-526");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
