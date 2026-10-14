import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryManualTouchpointSegmentStore } from "./manual-touchpoint-segment-store.js";
import { newManualTouchpointSegment } from "./manual-touchpoint-segment.js";

test("MemoryManualTouchpointSegmentStore finds what it saved", () => {
  const store = newMemoryManualTouchpointSegmentStore();
  const item = newManualTouchpointSegment("code-962", "title-544");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
