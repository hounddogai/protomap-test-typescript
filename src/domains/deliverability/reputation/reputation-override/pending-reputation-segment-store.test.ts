import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryPendingReputationSegmentStore } from "./pending-reputation-segment-store.js";
import { newPendingReputationSegment } from "./pending-reputation-segment.js";

test("MemoryPendingReputationSegmentStore finds what it saved", () => {
  const store = newMemoryPendingReputationSegmentStore();
  const item = newPendingReputationSegment("code-839", "title-611");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
