import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryFallbackFraudCheckExceptionStore } from "./fallback-fraud-check-exception-store.js";
import { newFallbackFraudCheckException } from "./fallback-fraud-check-exception.js";

test("MemoryFallbackFraudCheckExceptionStore finds what it saved", () => {
  const store = newMemoryFallbackFraudCheckExceptionStore();
  const item = newFallbackFraudCheckException("code-932", "label-727");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
