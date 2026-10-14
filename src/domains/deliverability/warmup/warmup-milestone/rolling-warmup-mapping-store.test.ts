import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryRollingWarmupMappingStore } from "./rolling-warmup-mapping-store.js";
import { newRollingWarmupMapping } from "./rolling-warmup-mapping.js";

test("MemoryRollingWarmupMappingStore finds what it saved", () => {
  const store = newMemoryRollingWarmupMappingStore();
  const item = newRollingWarmupMapping("code-794", "label-700");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
