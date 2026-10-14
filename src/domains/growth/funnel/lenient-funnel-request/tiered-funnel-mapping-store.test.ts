import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryTieredFunnelMappingStore } from "./tiered-funnel-mapping-store.js";
import { newTieredFunnelMapping } from "./tiered-funnel-mapping.js";

test("MemoryTieredFunnelMappingStore finds what it saved", () => {
  const store = newMemoryTieredFunnelMappingStore();
  const item = newTieredFunnelMapping("code-397", "name-951");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
