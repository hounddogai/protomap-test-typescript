import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryScheduledPathDigestStore } from "./scheduled-path-digest-store.js";
import { newScheduledPathDigest } from "./scheduled-path-digest.js";

test("MemoryScheduledPathDigestStore finds what it saved", () => {
  const store = newMemoryScheduledPathDigestStore();
  const item = newScheduledPathDigest("code-686", "title-875");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
