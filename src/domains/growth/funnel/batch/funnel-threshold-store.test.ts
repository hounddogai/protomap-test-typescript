import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryFunnelThresholdStore } from "./funnel-threshold-store.js";
import { newFunnelThreshold } from "./funnel-threshold.js";

test("MemoryFunnelThresholdStore finds what it saved", () => {
  const store = newMemoryFunnelThresholdStore();
  const item = newFunnelThreshold("code-233", "title-103");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
