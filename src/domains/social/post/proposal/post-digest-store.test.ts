import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryPostDigestStore } from "./post-digest-store.js";
import { newPostDigest } from "./post-digest.js";

test("MemoryPostDigestStore finds what it saved", () => {
  const store = newMemoryPostDigestStore();
  const item = newPostDigest("code-169", "name-230");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
