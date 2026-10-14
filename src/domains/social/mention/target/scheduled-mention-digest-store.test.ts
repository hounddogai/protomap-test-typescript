import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryScheduledMentionDigestStore } from "./scheduled-mention-digest-store.js";
import { newScheduledMentionDigest } from "./scheduled-mention-digest.js";

test("MemoryScheduledMentionDigestStore finds what it saved", () => {
  const store = newMemoryScheduledMentionDigestStore();
  const item = newScheduledMentionDigest("code-280", "label-702");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
