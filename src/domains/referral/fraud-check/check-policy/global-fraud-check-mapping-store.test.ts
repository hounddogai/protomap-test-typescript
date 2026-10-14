import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryGlobalFraudCheckMappingStore } from "./global-fraud-check-mapping-store.js";
import { newGlobalFraudCheckMapping } from "./global-fraud-check-mapping.js";

test("MemoryGlobalFraudCheckMappingStore finds what it saved", () => {
  const store = newMemoryGlobalFraudCheckMappingStore();
  const item = newGlobalFraudCheckMapping("code-472", "label-548");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
