import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryGlobalPlacementGroupStore } from "./global-placement-group-store.js";
import { newGlobalPlacementGroup } from "./global-placement-group.js";

test("MemoryGlobalPlacementGroupStore finds what it saved", () => {
  const store = newMemoryGlobalPlacementGroupStore();
  const item = newGlobalPlacementGroup("code-113", "title-388");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
