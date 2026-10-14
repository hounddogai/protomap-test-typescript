import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryLenientWarmupEntryStore } from "./lenient-warmup-entry-store.js";
import { newLenientWarmupEntry } from "./lenient-warmup-entry.js";

test("MemoryLenientWarmupEntryStore finds what it saved", () => {
  const store = newMemoryLenientWarmupEntryStore();
  const item = newLenientWarmupEntry("code-464", "title-337");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
