import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryTieredFraudCheckRequestStore } from "./tiered-fraud-check-request-store.js";
import { newTieredFraudCheckRequest } from "./tiered-fraud-check-request.js";

test("MemoryTieredFraudCheckRequestStore finds what it saved", () => {
  const store = newMemoryTieredFraudCheckRequestStore();
  const item = newTieredFraudCheckRequest("code-861", "label-234");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
