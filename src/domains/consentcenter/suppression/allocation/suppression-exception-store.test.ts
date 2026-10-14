import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemorySuppressionExceptionStore } from "./suppression-exception-store.js";
import { newSuppressionException } from "./suppression-exception.js";

test("MemorySuppressionExceptionStore finds what it saved", () => {
  const store = newMemorySuppressionExceptionStore();
  const item = newSuppressionException("code-827", "title-910");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
