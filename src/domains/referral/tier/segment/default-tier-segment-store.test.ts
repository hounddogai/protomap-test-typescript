import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryDefaultTierSegmentStore } from "./default-tier-segment-store.js";
import { newDefaultTierSegment } from "./default-tier-segment.js";

test("MemoryDefaultTierSegmentStore finds what it saved", () => {
  const store = newMemoryDefaultTierSegmentStore();
  const item = newDefaultTierSegment("code-38", "label-149");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
