import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryPrimaryFunnelRecordStore } from "./primary-funnel-record-store.js";
import { newPrimaryFunnelRecord } from "./primary-funnel-record.js";

test("MemoryPrimaryFunnelRecordStore finds what it saved", () => {
  const store = newMemoryPrimaryFunnelRecordStore();
  const item = newPrimaryFunnelRecord("code-72", "label-165");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
