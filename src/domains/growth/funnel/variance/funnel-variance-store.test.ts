import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryFunnelVarianceStore } from "./funnel-variance-store.js";
import { newFunnelVariance } from "./funnel-variance.js";

test("MemoryFunnelVarianceStore finds what it saved", () => {
  const store = newMemoryFunnelVarianceStore();
  const item = newFunnelVariance("code-842", "name-455");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
