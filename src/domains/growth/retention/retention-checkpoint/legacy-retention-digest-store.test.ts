import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryLegacyRetentionDigestStore } from "./legacy-retention-digest-store.js";
import { newLegacyRetentionDigest } from "./legacy-retention-digest.js";

test("MemoryLegacyRetentionDigestStore finds what it saved", () => {
  const store = newMemoryLegacyRetentionDigestStore();
  const item = newLegacyRetentionDigest("code-543", "title-631");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
