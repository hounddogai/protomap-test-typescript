import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryFallbackFunnelThresholdStore } from "./fallback-funnel-threshold-store.js";
import { newFallbackFunnelThreshold } from "./fallback-funnel-threshold.js";

test("MemoryFallbackFunnelThresholdStore finds what it saved", () => {
  const store = newMemoryFallbackFunnelThresholdStore();
  const item = newFallbackFunnelThreshold("code-49", "title-788");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
