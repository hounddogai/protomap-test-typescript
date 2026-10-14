import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryCreditVarianceStore } from "./credit-variance-store.js";
import { newCreditVariance } from "./credit-variance.js";

test("MemoryCreditVarianceStore finds what it saved", () => {
  const store = newMemoryCreditVarianceStore();
  const item = newCreditVariance("code-291", "title-786");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
