import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryManualBounceExceptionStore } from "./manual-bounce-exception-store.js";
import { newManualBounceException } from "./manual-bounce-exception.js";

test("MemoryManualBounceExceptionStore finds what it saved", () => {
  const store = newMemoryManualBounceExceptionStore();
  const item = newManualBounceException("code-619", "title-615");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
