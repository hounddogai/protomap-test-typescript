import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryFallbackRetentionRecordStore } from "./fallback-retention-record-store.js";
import { newFallbackRetentionRecord } from "./fallback-retention-record.js";

test("MemoryFallbackRetentionRecordStore finds what it saved", () => {
  const store = newMemoryFallbackRetentionRecordStore();
  const item = newFallbackRetentionRecord("code-785", "name-732");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
