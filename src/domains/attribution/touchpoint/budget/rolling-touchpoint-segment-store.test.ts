import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryRollingTouchpointSegmentStore } from "./rolling-touchpoint-segment-store.js";
import { newRollingTouchpointSegment } from "./rolling-touchpoint-segment.js";

test("MemoryRollingTouchpointSegmentStore finds what it saved", () => {
  const store = newMemoryRollingTouchpointSegmentStore();
  const item = newRollingTouchpointSegment("code-772", "name-806");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
