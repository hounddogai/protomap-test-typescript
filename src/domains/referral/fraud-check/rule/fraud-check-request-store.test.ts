import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryFraudCheckRequestStore } from "./fraud-check-request-store.js";
import { newFraudCheckRequest } from "./fraud-check-request.js";

test("MemoryFraudCheckRequestStore finds what it saved", () => {
  const store = newMemoryFraudCheckRequestStore();
  const item = newFraudCheckRequest("code-873", "label-551");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
