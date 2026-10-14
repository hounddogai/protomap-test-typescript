import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryBatchedTierGroupStore } from "./batched-tier-group-store.js";
import { newBatchedTierGroup } from "./batched-tier-group.js";

test("MemoryBatchedTierGroupStore finds what it saved", () => {
  const store = newMemoryBatchedTierGroupStore();
  const item = newBatchedTierGroup("code-560", "title-679");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
