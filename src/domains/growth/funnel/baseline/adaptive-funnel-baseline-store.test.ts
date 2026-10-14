import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryAdaptiveFunnelBaselineStore } from "./adaptive-funnel-baseline-store.js";
import { newAdaptiveFunnelBaseline } from "./adaptive-funnel-baseline.js";

test("MemoryAdaptiveFunnelBaselineStore finds what it saved", () => {
  const store = newMemoryAdaptiveFunnelBaselineStore();
  const item = newAdaptiveFunnelBaseline("code-80", "title-718");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
