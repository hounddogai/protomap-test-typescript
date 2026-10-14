import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryBounceSegmentStore } from "./bounce-segment-store.js";
import { newBounceSegment } from "./bounce-segment.js";

test("MemoryBounceSegmentStore finds what it saved", () => {
  const store = newMemoryBounceSegmentStore();
  const item = newBounceSegment("code-868", "name-780");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
