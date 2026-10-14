import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryPayoutThresholdStore } from "./payout-threshold-store.js";
import { newPayoutThreshold } from "./payout-threshold.js";

test("MemoryPayoutThresholdStore finds what it saved", () => {
  const store = newMemoryPayoutThresholdStore();
  const item = newPayoutThreshold("code-262", "title-309");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
