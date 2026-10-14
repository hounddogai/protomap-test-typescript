import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryReputationMappingStore } from "./reputation-mapping-store.js";
import { newReputationMapping } from "./reputation-mapping.js";

test("MemoryReputationMappingStore finds what it saved", () => {
  const store = newMemoryReputationMappingStore();
  const item = newReputationMapping("code-218", "name-579");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
