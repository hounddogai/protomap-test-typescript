import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryDefaultCsatRecordStore } from "./default-csat-record-store.js";
import { newDefaultCsatRecord } from "./default-csat-record.js";

test("MemoryDefaultCsatRecordStore finds what it saved", () => {
  const store = newMemoryDefaultCsatRecordStore();
  const item = newDefaultCsatRecord("code-911", "title-381");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
