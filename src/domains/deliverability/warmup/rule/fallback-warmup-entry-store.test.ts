import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryFallbackWarmupEntryStore } from "./fallback-warmup-entry-store.js";
import { newFallbackWarmupEntry } from "./fallback-warmup-entry.js";

test("MemoryFallbackWarmupEntryStore finds what it saved", () => {
  const store = newMemoryFallbackWarmupEntryStore();
  const item = newFallbackWarmupEntry("code-300", "title-522");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
