import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryRetentionSegmentStore } from "./retention-segment-store.js";
import { newRetentionSegment } from "./retention-segment.js";

test("MemoryRetentionSegmentStore finds what it saved", () => {
  const store = newMemoryRetentionSegmentStore();
  const item = newRetentionSegment("code-92", "name-532");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
