import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryBatchedFunnelThresholdStore } from "./batched-funnel-threshold-store.js";
import { newBatchedFunnelThreshold } from "./batched-funnel-threshold.js";

test("MemoryBatchedFunnelThresholdStore finds what it saved", () => {
  const store = newMemoryBatchedFunnelThresholdStore();
  const item = newBatchedFunnelThreshold("code-104", "label-428");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
