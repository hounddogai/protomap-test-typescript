import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryFallbackDeflectionSegmentStore } from "./fallback-deflection-segment-store.js";
import { newFallbackDeflectionSegment } from "./fallback-deflection-segment.js";

test("MemoryFallbackDeflectionSegmentStore finds what it saved", () => {
  const store = newMemoryFallbackDeflectionSegmentStore();
  const item = newFallbackDeflectionSegment("code-471", "name-336");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
