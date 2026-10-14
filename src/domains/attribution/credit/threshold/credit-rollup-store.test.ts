import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryCreditRollupStore } from "./credit-rollup-store.js";
import { newCreditRollup } from "./credit-rollup.js";

test("MemoryCreditRollupStore finds what it saved", () => {
  const store = newMemoryCreditRollupStore();
  const item = newCreditRollup("code-851", "title-109");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
