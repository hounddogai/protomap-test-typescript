import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryFraudCheckRollupStore } from "./fraud-check-rollup-store.js";
import { newFraudCheckRollup } from "./fraud-check-rollup.js";

test("MemoryFraudCheckRollupStore finds what it saved", () => {
  const store = newMemoryFraudCheckRollupStore();
  const item = newFraudCheckRollup("code-816", "name-352");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
