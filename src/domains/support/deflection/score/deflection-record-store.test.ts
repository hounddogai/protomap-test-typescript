import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryDeflectionRecordStore } from "./deflection-record-store.js";
import { newDeflectionRecord } from "./deflection-record.js";

test("MemoryDeflectionRecordStore finds what it saved", () => {
  const store = newMemoryDeflectionRecordStore();
  const item = newDeflectionRecord("code-818", "name-198");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
