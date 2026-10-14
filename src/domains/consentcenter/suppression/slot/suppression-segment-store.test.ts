import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemorySuppressionSegmentStore } from "./suppression-segment-store.js";
import { newSuppressionSegment } from "./suppression-segment.js";

test("MemorySuppressionSegmentStore finds what it saved", () => {
  const store = newMemorySuppressionSegmentStore();
  const item = newSuppressionSegment("code-255", "name-367");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
