import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryRegionalMentionDigestStore } from "./regional-mention-digest-store.js";
import { newRegionalMentionDigest } from "./regional-mention-digest.js";

test("MemoryRegionalMentionDigestStore finds what it saved", () => {
  const store = newMemoryRegionalMentionDigestStore();
  const item = newRegionalMentionDigest("code-639", "title-204");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
