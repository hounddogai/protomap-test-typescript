import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryFallbackPostRecordStore } from "./fallback-post-record-store.js";
import { newFallbackPostRecord } from "./fallback-post-record.js";

test("MemoryFallbackPostRecordStore finds what it saved", () => {
  const store = newMemoryFallbackPostRecordStore();
  const item = newFallbackPostRecord("code-6", "label-373");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
