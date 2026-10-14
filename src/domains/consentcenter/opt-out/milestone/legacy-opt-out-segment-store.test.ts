import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryLegacyOptOutSegmentStore } from "./legacy-opt-out-segment-store.js";
import { newLegacyOptOutSegment } from "./legacy-opt-out-segment.js";

test("MemoryLegacyOptOutSegmentStore finds what it saved", () => {
  const store = newMemoryLegacyOptOutSegmentStore();
  const item = newLegacyOptOutSegment("code-819", "label-345");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
