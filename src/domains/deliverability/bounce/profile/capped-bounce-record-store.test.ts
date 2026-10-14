import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryCappedBounceRecordStore } from "./capped-bounce-record-store.js";
import { newCappedBounceRecord } from "./capped-bounce-record.js";

test("MemoryCappedBounceRecordStore finds what it saved", () => {
  const store = newMemoryCappedBounceRecordStore();
  const item = newCappedBounceRecord("code-586", "title-825");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
