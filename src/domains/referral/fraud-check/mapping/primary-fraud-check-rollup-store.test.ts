import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryPrimaryFraudCheckRollupStore } from "./primary-fraud-check-rollup-store.js";
import { newPrimaryFraudCheckRollup } from "./primary-fraud-check-rollup.js";

test("MemoryPrimaryFraudCheckRollupStore finds what it saved", () => {
  const store = newMemoryPrimaryFraudCheckRollupStore();
  const item = newPrimaryFraudCheckRollup("code-681", "label-440");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
