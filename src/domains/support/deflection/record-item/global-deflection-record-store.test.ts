import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryGlobalDeflectionRecordStore } from "./global-deflection-record-store.js";
import { newGlobalDeflectionRecord } from "./global-deflection-record.js";

test("MemoryGlobalDeflectionRecordStore finds what it saved", () => {
  const store = newMemoryGlobalDeflectionRecordStore();
  const item = newGlobalDeflectionRecord("code-298", "label-328");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
