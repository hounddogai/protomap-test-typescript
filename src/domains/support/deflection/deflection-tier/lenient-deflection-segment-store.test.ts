import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryLenientDeflectionSegmentStore } from "./lenient-deflection-segment-store.js";
import { newLenientDeflectionSegment } from "./lenient-deflection-segment.js";

test("MemoryLenientDeflectionSegmentStore finds what it saved", () => {
  const store = newMemoryLenientDeflectionSegmentStore();
  const item = newLenientDeflectionSegment("code-176", "name-488");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
