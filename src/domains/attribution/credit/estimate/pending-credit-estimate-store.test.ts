import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryPendingCreditEstimateStore } from "./pending-credit-estimate-store.js";
import { newPendingCreditEstimate } from "./pending-credit-estimate.js";

test("MemoryPendingCreditEstimateStore finds what it saved", () => {
  const store = newMemoryPendingCreditEstimateStore();
  const item = newPendingCreditEstimate("code-355", "label-980");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
