import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryWeightedFraudCheckExceptionStore } from "./weighted-fraud-check-exception-store.js";
import { newWeightedFraudCheckException } from "./weighted-fraud-check-exception.js";

test("MemoryWeightedFraudCheckExceptionStore finds what it saved", () => {
  const store = newMemoryWeightedFraudCheckExceptionStore();
  const item = newWeightedFraudCheckException("code-896", "title-817");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
