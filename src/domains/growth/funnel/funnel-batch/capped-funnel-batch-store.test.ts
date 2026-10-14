import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryCappedFunnelBatchStore } from "./capped-funnel-batch-store.js";
import { newCappedFunnelBatch } from "./capped-funnel-batch.js";

test("MemoryCappedFunnelBatchStore finds what it saved", () => {
  const store = newMemoryCappedFunnelBatchStore();
  const item = newCappedFunnelBatch("code-32", "name-489");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
