import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryTieredConversionRecordStore } from "./tiered-conversion-record-store.js";
import { newTieredConversionRecord } from "./tiered-conversion-record.js";

test("MemoryTieredConversionRecordStore finds what it saved", () => {
  const store = newMemoryTieredConversionRecordStore();
  const item = newTieredConversionRecord("code-785", "name-947");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
