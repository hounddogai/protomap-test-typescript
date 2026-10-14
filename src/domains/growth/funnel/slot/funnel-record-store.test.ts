import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryFunnelRecordStore } from "./funnel-record-store.js";
import { newFunnelRecord } from "./funnel-record.js";

test("MemoryFunnelRecordStore finds what it saved", () => {
  const store = newMemoryFunnelRecordStore();
  const item = newFunnelRecord("code-759", "label-854");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
