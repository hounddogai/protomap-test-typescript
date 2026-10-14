import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryBadgeSegmentStore } from "./badge-segment-store.js";
import { newBadgeSegment } from "./badge-segment.js";

test("MemoryBadgeSegmentStore finds what it saved", () => {
  const store = newMemoryBadgeSegmentStore();
  const item = newBadgeSegment("code-665", "name-229");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
