import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryDefaultReplyDigestStore } from "./default-reply-digest-store.js";
import { newDefaultReplyDigest } from "./default-reply-digest.js";

test("MemoryDefaultReplyDigestStore finds what it saved", () => {
  const store = newMemoryDefaultReplyDigestStore();
  const item = newDefaultReplyDigest("code-36", "label-435");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
