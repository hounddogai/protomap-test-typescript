import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryModelSegmentStore } from "./model-segment-store.js";
import { newModelSegment } from "./model-segment.js";

test("MemoryModelSegmentStore finds what it saved", () => {
  const store = newMemoryModelSegmentStore();
  const item = newModelSegment("code-517", "title-401");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
