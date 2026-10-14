import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryCappedFraudCheckExceptionStore } from "./capped-fraud-check-exception-store.js";
import { newCappedFraudCheckException } from "./capped-fraud-check-exception.js";

test("MemoryCappedFraudCheckExceptionStore finds what it saved", () => {
  const store = newMemoryCappedFraudCheckExceptionStore();
  const item = newCappedFraudCheckException("code-910", "title-709");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
