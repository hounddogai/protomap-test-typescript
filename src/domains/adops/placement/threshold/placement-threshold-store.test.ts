import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryPlacementThresholdStore } from "./placement-threshold-store.js";
import { newPlacementThreshold } from "./placement-threshold.js";

test("MemoryPlacementThresholdStore finds what it saved", () => {
  const store = newMemoryPlacementThresholdStore();
  const item = newPlacementThreshold("code-917", "name-562");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
