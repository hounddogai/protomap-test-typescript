import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryTierRecordStore } from "./tier-record-store.js";
import { newTierRecord } from "./tier-record.js";

test("MemoryTierRecordStore finds what it saved", () => {
  const store = newMemoryTierRecordStore();
  const item = newTierRecord("code-985", "label-777");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
