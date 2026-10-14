import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryFallbackPlacementGroupStore } from "./fallback-placement-group-store.js";
import { newFallbackPlacementGroup } from "./fallback-placement-group.js";

test("MemoryFallbackPlacementGroupStore finds what it saved", () => {
  const store = newMemoryFallbackPlacementGroupStore();
  const item = newFallbackPlacementGroup("code-927", "title-26");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
