import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryLegacyPayoutSegmentStore } from "./legacy-payout-segment-store.js";
import { newLegacyPayoutSegment } from "./legacy-payout-segment.js";

test("MemoryLegacyPayoutSegmentStore finds what it saved", () => {
  const store = newMemoryLegacyPayoutSegmentStore();
  const item = newLegacyPayoutSegment("code-845", "name-525");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
