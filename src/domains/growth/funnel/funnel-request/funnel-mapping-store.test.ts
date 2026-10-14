import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryFunnelMappingStore } from "./funnel-mapping-store.js";
import { newFunnelMapping } from "./funnel-mapping.js";

test("MemoryFunnelMappingStore finds what it saved", () => {
  const store = newMemoryFunnelMappingStore();
  const item = newFunnelMapping("code-86", "name-376");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
