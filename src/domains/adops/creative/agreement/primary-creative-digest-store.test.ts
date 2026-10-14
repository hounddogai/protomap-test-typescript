import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryPrimaryCreativeDigestStore } from "./primary-creative-digest-store.js";
import { newPrimaryCreativeDigest } from "./primary-creative-digest.js";

test("MemoryPrimaryCreativeDigestStore finds what it saved", () => {
  const store = newMemoryPrimaryCreativeDigestStore();
  const item = newPrimaryCreativeDigest("code-816", "name-502");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
