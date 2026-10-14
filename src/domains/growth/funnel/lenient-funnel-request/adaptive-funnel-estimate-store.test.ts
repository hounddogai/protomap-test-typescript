import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryAdaptiveFunnelEstimateStore } from "./adaptive-funnel-estimate-store.js";
import { newAdaptiveFunnelEstimate } from "./adaptive-funnel-estimate.js";

test("MemoryAdaptiveFunnelEstimateStore finds what it saved", () => {
  const store = newMemoryAdaptiveFunnelEstimateStore();
  const item = newAdaptiveFunnelEstimate("code-865", "title-268");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
