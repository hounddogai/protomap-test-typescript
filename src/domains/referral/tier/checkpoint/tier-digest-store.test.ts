import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryTierDigestStore } from "./tier-digest-store.js";
import { newTierDigest } from "./tier-digest.js";

test("MemoryTierDigestStore finds what it saved", () => {
  const store = newMemoryTierDigestStore();
  const item = newTierDigest("code-507", "label-893");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
