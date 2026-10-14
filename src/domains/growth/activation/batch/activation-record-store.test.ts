import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryActivationRecordStore } from "./activation-record-store.js";
import { newActivationRecord } from "./activation-record.js";

test("MemoryActivationRecordStore finds what it saved", () => {
  const store = newMemoryActivationRecordStore();
  const item = newActivationRecord("code-768", "name-340");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
