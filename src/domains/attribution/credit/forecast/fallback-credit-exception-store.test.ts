import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryFallbackCreditExceptionStore } from "./fallback-credit-exception-store.js";
import { newFallbackCreditException } from "./fallback-credit-exception.js";

test("MemoryFallbackCreditExceptionStore finds what it saved", () => {
  const store = newMemoryFallbackCreditExceptionStore();
  const item = newFallbackCreditException("code-289", "label-584");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
