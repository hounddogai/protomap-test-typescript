import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryFallbackPlacementRecordStore } from "./fallback-placement-record-store.js";
import { newFallbackPlacementRecord } from "./fallback-placement-record.js";

test("MemoryFallbackPlacementRecordStore finds what it saved", () => {
  const store = newMemoryFallbackPlacementRecordStore();
  const item = newFallbackPlacementRecord("code-174", "title-588");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
