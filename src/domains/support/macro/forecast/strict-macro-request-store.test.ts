import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryStrictMacroRequestStore } from "./strict-macro-request-store.js";
import { newStrictMacroRequest } from "./strict-macro-request.js";

test("MemoryStrictMacroRequestStore finds what it saved", () => {
  const store = newMemoryStrictMacroRequestStore();
  const item = newStrictMacroRequest("code-142", "title-249");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
