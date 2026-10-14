import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryReplyRequestStore } from "./reply-request-store.js";
import { newReplyRequest } from "./reply-request.js";

test("MemoryReplyRequestStore finds what it saved", () => {
  const store = newMemoryReplyRequestStore();
  const item = newReplyRequest("code-87", "title-76");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
