import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryWindowExceptionStore } from "./window-exception-store.js";
import { newWindowException } from "./window-exception.js";

test("MemoryWindowExceptionStore finds what it saved", () => {
  const store = newMemoryWindowExceptionStore();
  const item = newWindowException("code-938", "name-561");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
