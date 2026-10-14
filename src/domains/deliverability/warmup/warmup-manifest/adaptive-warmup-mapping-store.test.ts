import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryAdaptiveWarmupMappingStore } from "./adaptive-warmup-mapping-store.js";
import { newAdaptiveWarmupMapping } from "./adaptive-warmup-mapping.js";

test("MemoryAdaptiveWarmupMappingStore finds what it saved", () => {
  const store = newMemoryAdaptiveWarmupMappingStore();
  const item = newAdaptiveWarmupMapping("code-217", "name-47");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
