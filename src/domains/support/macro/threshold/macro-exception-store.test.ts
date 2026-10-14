import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryMacroExceptionStore } from "./macro-exception-store.js";
import { newMacroException } from "./macro-exception.js";

test("MemoryMacroExceptionStore finds what it saved", () => {
  const store = newMemoryMacroExceptionStore();
  const item = newMacroException("code-389", "name-791");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
