import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryWindowSegmentStore } from "./window-segment-store.js";
import { newWindowSegment } from "./window-segment.js";

test("MemoryWindowSegmentStore finds what it saved", () => {
  const store = newMemoryWindowSegmentStore();
  const item = newWindowSegment("code-983", "name-245");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
