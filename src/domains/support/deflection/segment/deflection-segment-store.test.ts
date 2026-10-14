import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryDeflectionSegmentStore } from "./deflection-segment-store.js";
import { newDeflectionSegment } from "./deflection-segment.js";

test("MemoryDeflectionSegmentStore finds what it saved", () => {
  const store = newMemoryDeflectionSegmentStore();
  const item = newDeflectionSegment("code-355", "name-661");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
