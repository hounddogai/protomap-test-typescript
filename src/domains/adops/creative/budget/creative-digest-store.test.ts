import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryCreativeDigestStore } from "./creative-digest-store.js";
import { newCreativeDigest } from "./creative-digest.js";

test("MemoryCreativeDigestStore finds what it saved", () => {
  const store = newMemoryCreativeDigestStore();
  const item = newCreativeDigest("code-587", "label-337");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
