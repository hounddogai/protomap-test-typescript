import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryLegacyReplyDigestStore } from "./legacy-reply-digest-store.js";
import { newLegacyReplyDigest } from "./legacy-reply-digest.js";

test("MemoryLegacyReplyDigestStore finds what it saved", () => {
  const store = newMemoryLegacyReplyDigestStore();
  const item = newLegacyReplyDigest("code-714", "title-964");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
