import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryStrictSenderSegmentStore } from "./strict-sender-segment-store.js";
import { newStrictSenderSegment } from "./strict-sender-segment.js";

test("MemoryStrictSenderSegmentStore finds what it saved", () => {
  const store = newMemoryStrictSenderSegmentStore();
  const item = newStrictSenderSegment("code-409", "title-912");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
