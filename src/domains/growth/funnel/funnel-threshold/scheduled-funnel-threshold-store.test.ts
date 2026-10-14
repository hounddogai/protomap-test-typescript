import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryScheduledFunnelThresholdStore } from "./scheduled-funnel-threshold-store.js";
import { newScheduledFunnelThreshold } from "./scheduled-funnel-threshold.js";

test("MemoryScheduledFunnelThresholdStore finds what it saved", () => {
  const store = newMemoryScheduledFunnelThresholdStore();
  const item = newScheduledFunnelThreshold("code-463", "title-477");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
