import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemorySlaSegmentStore } from "./sla-segment-store.js";
import { newSlaSegment } from "./sla-segment.js";

test("MemorySlaSegmentStore finds what it saved", () => {
  const store = newMemorySlaSegmentStore();
  const item = newSlaSegment("code-583", "title-688");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
