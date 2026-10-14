import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryGlobalConversionSegmentStore } from "./global-conversion-segment-store.js";
import { newGlobalConversionSegment } from "./global-conversion-segment.js";

test("MemoryGlobalConversionSegmentStore finds what it saved", () => {
  const store = newMemoryGlobalConversionSegmentStore();
  const item = newGlobalConversionSegment("code-972", "title-974");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
