import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryBatchedPlacementGroupStore } from "./batched-placement-group-store.js";
import { newBatchedPlacementGroup } from "./batched-placement-group.js";

test("MemoryBatchedPlacementGroupStore finds what it saved", () => {
  const store = newMemoryBatchedPlacementGroupStore();
  const item = newBatchedPlacementGroup("code-305", "title-768");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
