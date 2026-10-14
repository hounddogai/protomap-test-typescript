import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryRollingMacroRecordStore } from "./rolling-macro-record-store.js";
import { newRollingMacroRecord } from "./rolling-macro-record.js";

test("MemoryRollingMacroRecordStore finds what it saved", () => {
  const store = newMemoryRollingMacroRecordStore();
  const item = newRollingMacroRecord("code-86", "name-505");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
