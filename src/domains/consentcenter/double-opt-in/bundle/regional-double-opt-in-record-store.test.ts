import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryRegionalDoubleOptInRecordStore } from "./regional-double-opt-in-record-store.js";
import { newRegionalDoubleOptInRecord } from "./regional-double-opt-in-record.js";

test("MemoryRegionalDoubleOptInRecordStore finds what it saved", () => {
  const store = newMemoryRegionalDoubleOptInRecordStore();
  const item = newRegionalDoubleOptInRecord("code-162", "title-862");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
