import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryWeightedRetentionGroupStore } from "./weighted-retention-group-store.js";
import { newWeightedRetentionGroup } from "./weighted-retention-group.js";

test("MemoryWeightedRetentionGroupStore finds what it saved", () => {
  const store = newMemoryWeightedRetentionGroupStore();
  const item = newWeightedRetentionGroup("code-698", "name-613");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
