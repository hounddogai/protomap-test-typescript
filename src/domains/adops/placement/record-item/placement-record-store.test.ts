import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryPlacementRecordStore } from "./placement-record-store.js";
import { newPlacementRecord } from "./placement-record.js";

test("MemoryPlacementRecordStore finds what it saved", () => {
  const store = newMemoryPlacementRecordStore();
  const item = newPlacementRecord("code-429", "name-207");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
