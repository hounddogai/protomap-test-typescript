import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryCappedCreditThresholdStore } from "./capped-credit-threshold-store.js";
import { newCappedCreditThreshold } from "./capped-credit-threshold.js";

test("MemoryCappedCreditThresholdStore finds what it saved", () => {
  const store = newMemoryCappedCreditThresholdStore();
  const item = newCappedCreditThreshold("code-858", "title-394");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
