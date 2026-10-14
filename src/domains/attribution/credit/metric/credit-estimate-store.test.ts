import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryCreditEstimateStore } from "./credit-estimate-store.js";
import { newCreditEstimate } from "./credit-estimate.js";

test("MemoryCreditEstimateStore finds what it saved", () => {
  const store = newMemoryCreditEstimateStore();
  const item = newCreditEstimate("code-695", "title-391");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
