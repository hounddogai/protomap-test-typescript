import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryStrictSuppressionExceptionStore } from "./strict-suppression-exception-store.js";
import { newStrictSuppressionException } from "./strict-suppression-exception.js";

test("MemoryStrictSuppressionExceptionStore finds what it saved", () => {
  const store = newMemoryStrictSuppressionExceptionStore();
  const item = newStrictSuppressionException("code-616", "name-169");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
