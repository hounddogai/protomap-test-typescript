import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemorySeasonalFlightRecordStore } from "./seasonal-flight-record-store.js";
import { newSeasonalFlightRecord } from "./seasonal-flight-record.js";

test("MemorySeasonalFlightRecordStore finds what it saved", () => {
  const store = newMemorySeasonalFlightRecordStore();
  const item = newSeasonalFlightRecord("code-830", "name-456");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
