import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryWeightedFraudCheckMappingStore } from "./weighted-fraud-check-mapping-store.js";
import { newWeightedFraudCheckMapping } from "./weighted-fraud-check-mapping.js";

test("MemoryWeightedFraudCheckMappingStore finds what it saved", () => {
  const store = newMemoryWeightedFraudCheckMappingStore();
  const item = newWeightedFraudCheckMapping("code-322", "name-536");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
