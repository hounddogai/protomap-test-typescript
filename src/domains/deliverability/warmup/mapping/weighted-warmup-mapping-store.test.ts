import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryWeightedWarmupMappingStore } from "./weighted-warmup-mapping-store.js";
import { newWeightedWarmupMapping } from "./weighted-warmup-mapping.js";

test("MemoryWeightedWarmupMappingStore finds what it saved", () => {
  const store = newMemoryWeightedWarmupMappingStore();
  const item = newWeightedWarmupMapping("code-894", "name-609");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
