import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryPayoutVarianceStore } from "./payout-variance-store.js";
import { newPayoutVariance } from "./payout-variance.js";

test("MemoryPayoutVarianceStore finds what it saved", () => {
  const store = newMemoryPayoutVarianceStore();
  const item = newPayoutVariance("code-803", "title-950");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
