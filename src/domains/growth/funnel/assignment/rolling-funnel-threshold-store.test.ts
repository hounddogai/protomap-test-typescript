import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryRollingFunnelThresholdStore } from "./rolling-funnel-threshold-store.js";
import { newRollingFunnelThreshold } from "./rolling-funnel-threshold.js";

test("MemoryRollingFunnelThresholdStore finds what it saved", () => {
  const store = newMemoryRollingFunnelThresholdStore();
  const item = newRollingFunnelThreshold("code-852", "title-941");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
