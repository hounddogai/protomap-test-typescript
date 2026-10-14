import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryReplyExceptionStore } from "./reply-exception-store.js";
import { newReplyException } from "./reply-exception.js";

test("MemoryReplyExceptionStore finds what it saved", () => {
  const store = newMemoryReplyExceptionStore();
  const item = newReplyException("code-124", "label-628");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
