import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryPendingFraudCheckMappingStore } from "./pending-fraud-check-mapping-store.js";
import { newPendingFraudCheckMapping } from "./pending-fraud-check-mapping.js";

test("MemoryPendingFraudCheckMappingStore finds what it saved", () => {
  const store = newMemoryPendingFraudCheckMappingStore();
  const item = newPendingFraudCheckMapping("code-217", "label-614");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
