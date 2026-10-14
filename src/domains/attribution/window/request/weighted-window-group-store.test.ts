import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryWeightedWindowGroupStore } from "./weighted-window-group-store.js";
import { newWeightedWindowGroup } from "./weighted-window-group.js";

test("MemoryWeightedWindowGroupStore finds what it saved", () => {
  const store = newMemoryWeightedWindowGroupStore();
  const item = newWeightedWindowGroup("code-746", "name-715");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
