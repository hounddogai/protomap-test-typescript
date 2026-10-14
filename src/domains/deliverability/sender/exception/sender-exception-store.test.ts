import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemorySenderExceptionStore } from "./sender-exception-store.js";
import { newSenderException } from "./sender-exception.js";

test("MemorySenderExceptionStore finds what it saved", () => {
  const store = newMemorySenderExceptionStore();
  const item = newSenderException("code-843", "label-50");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
