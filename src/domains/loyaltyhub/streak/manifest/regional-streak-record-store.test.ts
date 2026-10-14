import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryRegionalStreakRecordStore } from "./regional-streak-record-store.js";
import { newRegionalStreakRecord } from "./regional-streak-record.js";

test("MemoryRegionalStreakRecordStore finds what it saved", () => {
  const store = newMemoryRegionalStreakRecordStore();
  const item = newRegionalStreakRecord("code-972", "label-799");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
