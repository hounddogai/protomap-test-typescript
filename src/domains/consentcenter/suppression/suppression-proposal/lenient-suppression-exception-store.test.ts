import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryLenientSuppressionExceptionStore } from "./lenient-suppression-exception-store.js";
import { newLenientSuppressionException } from "./lenient-suppression-exception.js";

test("MemoryLenientSuppressionExceptionStore finds what it saved", () => {
  const store = newMemoryLenientSuppressionExceptionStore();
  const item = newLenientSuppressionException("code-118", "title-329");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
