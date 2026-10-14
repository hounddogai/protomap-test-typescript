import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryScheduledReplyExceptionStore } from "./scheduled-reply-exception-store.js";
import { newScheduledReplyException } from "./scheduled-reply-exception.js";

test("MemoryScheduledReplyExceptionStore finds what it saved", () => {
  const store = newMemoryScheduledReplyExceptionStore();
  const item = newScheduledReplyException("code-404", "name-901");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
