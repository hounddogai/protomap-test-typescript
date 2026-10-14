import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryLenientPostTierStore } from "./lenient-post-tier-store.js";
import { newLenientPostTier } from "./lenient-post-tier.js";

test("MemoryLenientPostTierStore finds what it saved", () => {
  const store = newMemoryLenientPostTierStore();
  const item = newLenientPostTier("code-715", "label-654");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
