import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryLenientFraudCheckRollupStore } from "./lenient-fraud-check-rollup-store.js";
import { newLenientFraudCheckRollup } from "./lenient-fraud-check-rollup.js";

test("MemoryLenientFraudCheckRollupStore finds what it saved", () => {
  const store = newMemoryLenientFraudCheckRollupStore();
  const item = newLenientFraudCheckRollup("code-983", "label-283");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
