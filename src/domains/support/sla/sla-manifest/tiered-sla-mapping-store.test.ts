import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryTieredSlaMappingStore } from "./tiered-sla-mapping-store.js";
import { newTieredSlaMapping } from "./tiered-sla-mapping.js";

test("MemoryTieredSlaMappingStore finds what it saved", () => {
  const store = newMemoryTieredSlaMappingStore();
  const item = newTieredSlaMapping("code-241", "title-966");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
