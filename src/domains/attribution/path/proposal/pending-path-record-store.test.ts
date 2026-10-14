import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryPendingPathRecordStore } from "./pending-path-record-store.js";
import { newPendingPathRecord } from "./pending-path-record.js";

test("MemoryPendingPathRecordStore finds what it saved", () => {
  const store = newMemoryPendingPathRecordStore();
  const item = newPendingPathRecord("code-820", "label-958");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
