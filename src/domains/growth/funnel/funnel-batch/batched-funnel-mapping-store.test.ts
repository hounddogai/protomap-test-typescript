import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryBatchedFunnelMappingStore } from "./batched-funnel-mapping-store.js";
import { newBatchedFunnelMapping } from "./batched-funnel-mapping.js";

test("MemoryBatchedFunnelMappingStore finds what it saved", () => {
  const store = newMemoryBatchedFunnelMappingStore();
  const item = newBatchedFunnelMapping("code-814", "title-506");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
