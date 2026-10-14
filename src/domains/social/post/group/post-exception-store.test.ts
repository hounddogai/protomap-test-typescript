import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryPostExceptionStore } from "./post-exception-store.js";
import { newPostException } from "./post-exception.js";

test("MemoryPostExceptionStore finds what it saved", () => {
  const store = newMemoryPostExceptionStore();
  const item = newPostException("code-30", "label-642");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
