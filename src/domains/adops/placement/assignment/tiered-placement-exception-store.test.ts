import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryTieredPlacementExceptionStore } from "./tiered-placement-exception-store.js";
import { newTieredPlacementException } from "./tiered-placement-exception.js";

test("MemoryTieredPlacementExceptionStore finds what it saved", () => {
  const store = newMemoryTieredPlacementExceptionStore();
  const item = newTieredPlacementException("code-465", "label-720");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
