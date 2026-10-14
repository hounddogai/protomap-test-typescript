import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryTieredCsatMappingStore } from "./tiered-csat-mapping-store.js";
import { newTieredCsatMapping } from "./tiered-csat-mapping.js";

test("MemoryTieredCsatMappingStore finds what it saved", () => {
  const store = newMemoryTieredCsatMappingStore();
  const item = newTieredCsatMapping("code-962", "title-975");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
