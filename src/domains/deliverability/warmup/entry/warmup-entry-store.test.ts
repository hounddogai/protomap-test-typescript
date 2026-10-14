import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryWarmupEntryStore } from "./warmup-entry-store.js";
import { newWarmupEntry } from "./warmup-entry.js";

test("MemoryWarmupEntryStore finds what it saved", () => {
  const store = newMemoryWarmupEntryStore();
  const item = newWarmupEntry("code-721", "title-771");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
