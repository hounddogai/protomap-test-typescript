import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryWeightedTierRecordStore } from "./weighted-tier-record-store.js";
import { newWeightedTierRecord } from "./weighted-tier-record.js";

test("MemoryWeightedTierRecordStore finds what it saved", () => {
  const store = newMemoryWeightedTierRecordStore();
  const item = newWeightedTierRecord("code-557", "name-184");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
