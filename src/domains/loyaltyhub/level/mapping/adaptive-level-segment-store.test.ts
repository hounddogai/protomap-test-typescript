import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryAdaptiveLevelSegmentStore } from "./adaptive-level-segment-store.js";
import { newAdaptiveLevelSegment } from "./adaptive-level-segment.js";

test("MemoryAdaptiveLevelSegmentStore finds what it saved", () => {
  const store = newMemoryAdaptiveLevelSegmentStore();
  const item = newAdaptiveLevelSegment("code-5", "title-12");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
