import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryFallbackFunnelEstimateStore } from "./fallback-funnel-estimate-store.js";
import { newFallbackFunnelEstimate } from "./fallback-funnel-estimate.js";

test("MemoryFallbackFunnelEstimateStore finds what it saved", () => {
  const store = newMemoryFallbackFunnelEstimateStore();
  const item = newFallbackFunnelEstimate("code-28", "label-869");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
