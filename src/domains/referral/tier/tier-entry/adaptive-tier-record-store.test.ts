import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryAdaptiveTierRecordStore } from "./adaptive-tier-record-store.js";
import { newAdaptiveTierRecord } from "./adaptive-tier-record.js";

test("MemoryAdaptiveTierRecordStore finds what it saved", () => {
  const store = newMemoryAdaptiveTierRecordStore();
  const item = newAdaptiveTierRecord("code-97", "title-101");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
