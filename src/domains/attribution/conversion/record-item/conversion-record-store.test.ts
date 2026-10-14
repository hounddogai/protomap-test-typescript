import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryConversionRecordStore } from "./conversion-record-store.js";
import { newConversionRecord } from "./conversion-record.js";

test("MemoryConversionRecordStore finds what it saved", () => {
  const store = newMemoryConversionRecordStore();
  const item = newConversionRecord("code-409", "title-545");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
