import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryReplyDigestStore } from "./reply-digest-store.js";
import { newReplyDigest } from "./reply-digest.js";

test("MemoryReplyDigestStore finds what it saved", () => {
  const store = newMemoryReplyDigestStore();
  const item = newReplyDigest("code-471", "label-602");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
