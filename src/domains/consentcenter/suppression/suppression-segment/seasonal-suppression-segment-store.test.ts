import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemorySeasonalSuppressionSegmentStore } from "./seasonal-suppression-segment-store.js";
import { newSeasonalSuppressionSegment } from "./seasonal-suppression-segment.js";

test("MemorySeasonalSuppressionSegmentStore finds what it saved", () => {
  const store = newMemorySeasonalSuppressionSegmentStore();
  const item = newSeasonalSuppressionSegment("code-205", "title-88");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
