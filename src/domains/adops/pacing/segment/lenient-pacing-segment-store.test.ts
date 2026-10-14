import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryLenientPacingSegmentStore } from "./lenient-pacing-segment-store.js";
import { newLenientPacingSegment } from "./lenient-pacing-segment.js";

test("MemoryLenientPacingSegmentStore finds what it saved", () => {
  const store = newMemoryLenientPacingSegmentStore();
  const item = newLenientPacingSegment("code-216", "title-329");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
