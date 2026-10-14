import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryPendingReputationMappingStore } from "./pending-reputation-mapping-store.js";
import { newPendingReputationMapping } from "./pending-reputation-mapping.js";

test("MemoryPendingReputationMappingStore finds what it saved", () => {
  const store = newMemoryPendingReputationMappingStore();
  const item = newPendingReputationMapping("code-990", "title-804");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
