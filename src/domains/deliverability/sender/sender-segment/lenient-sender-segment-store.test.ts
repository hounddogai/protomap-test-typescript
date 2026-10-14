import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryLenientSenderSegmentStore } from "./lenient-sender-segment-store.js";
import { newLenientSenderSegment } from "./lenient-sender-segment.js";

test("MemoryLenientSenderSegmentStore finds what it saved", () => {
  const store = newMemoryLenientSenderSegmentStore();
  const item = newLenientSenderSegment("code-617", "name-283");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
