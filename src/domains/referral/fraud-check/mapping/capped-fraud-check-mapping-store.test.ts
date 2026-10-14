import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryCappedFraudCheckMappingStore } from "./capped-fraud-check-mapping-store.js";
import { newCappedFraudCheckMapping } from "./capped-fraud-check-mapping.js";

test("MemoryCappedFraudCheckMappingStore finds what it saved", () => {
  const store = newMemoryCappedFraudCheckMappingStore();
  const item = newCappedFraudCheckMapping("code-398", "title-729");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
