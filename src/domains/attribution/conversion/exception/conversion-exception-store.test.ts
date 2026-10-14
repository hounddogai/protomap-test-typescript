import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryConversionExceptionStore } from "./conversion-exception-store.js";
import { newConversionException } from "./conversion-exception.js";

test("MemoryConversionExceptionStore finds what it saved", () => {
  const store = newMemoryConversionExceptionStore();
  const item = newConversionException("code-213", "name-534");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
