import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryWeightedPlacementRecordStore } from "./weighted-placement-record-store.js";
import { newWeightedPlacementRecord } from "./weighted-placement-record.js";

test("MemoryWeightedPlacementRecordStore finds what it saved", () => {
  const store = newMemoryWeightedPlacementRecordStore();
  const item = newWeightedPlacementRecord("code-175", "label-437");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
