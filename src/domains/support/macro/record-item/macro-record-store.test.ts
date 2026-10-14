import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryMacroRecordStore } from "./macro-record-store.js";
import { newMacroRecord } from "./macro-record.js";

test("MemoryMacroRecordStore finds what it saved", () => {
  const store = newMemoryMacroRecordStore();
  const item = newMacroRecord("code-446", "label-82");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
