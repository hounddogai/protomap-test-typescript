import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryRegionalDeflectionRecordStore } from "./regional-deflection-record-store.js";
import { newRegionalDeflectionRecord } from "./regional-deflection-record.js";

test("MemoryRegionalDeflectionRecordStore finds what it saved", () => {
  const store = newMemoryRegionalDeflectionRecordStore();
  const item = newRegionalDeflectionRecord("code-841", "label-541");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
