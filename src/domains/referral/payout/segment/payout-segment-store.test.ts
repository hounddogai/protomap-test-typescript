import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryPayoutSegmentStore } from "./payout-segment-store.js";
import { newPayoutSegment } from "./payout-segment.js";

test("MemoryPayoutSegmentStore finds what it saved", () => {
  const store = newMemoryPayoutSegmentStore();
  const item = newPayoutSegment("code-901", "label-555");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
