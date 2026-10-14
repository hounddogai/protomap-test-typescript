import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryInsightSegmentStore } from "./insight-segment-store.js";
import { newInsightSegment } from "./insight-segment.js";

test("MemoryInsightSegmentStore finds what it saved", () => {
  const store = newMemoryInsightSegmentStore();
  const item = newInsightSegment("code-835", "title-302");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
