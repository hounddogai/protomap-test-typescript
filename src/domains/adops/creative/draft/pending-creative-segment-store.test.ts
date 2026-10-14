import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryPendingCreativeSegmentStore } from "./pending-creative-segment-store.js";
import { newPendingCreativeSegment } from "./pending-creative-segment.js";

test("MemoryPendingCreativeSegmentStore finds what it saved", () => {
  const store = newMemoryPendingCreativeSegmentStore();
  const item = newPendingCreativeSegment("code-639", "title-204");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
