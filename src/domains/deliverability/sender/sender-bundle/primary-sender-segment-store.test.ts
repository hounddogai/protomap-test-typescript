import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryPrimarySenderSegmentStore } from "./primary-sender-segment-store.js";
import { newPrimarySenderSegment } from "./primary-sender-segment.js";

test("MemoryPrimarySenderSegmentStore finds what it saved", () => {
  const store = newMemoryPrimarySenderSegmentStore();
  const item = newPrimarySenderSegment("code-667", "label-978");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
