import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryOptOutSegmentStore } from "./opt-out-segment-store.js";
import { newOptOutSegment } from "./opt-out-segment.js";

test("MemoryOptOutSegmentStore finds what it saved", () => {
  const store = newMemoryOptOutSegmentStore();
  const item = newOptOutSegment("code-26", "title-157");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
