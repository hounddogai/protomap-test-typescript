import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryFallbackFunnelBatchStore } from "./fallback-funnel-batch-store.js";
import { newFallbackFunnelBatch } from "./fallback-funnel-batch.js";

test("MemoryFallbackFunnelBatchStore finds what it saved", () => {
  const store = newMemoryFallbackFunnelBatchStore();
  const item = newFallbackFunnelBatch("code-490", "name-356");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
