import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryOptOutExceptionStore } from "./opt-out-exception-store.js";
import { newOptOutException } from "./opt-out-exception.js";

test("MemoryOptOutExceptionStore finds what it saved", () => {
  const store = newMemoryOptOutExceptionStore();
  const item = newOptOutException("code-431", "label-926");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
