import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryFunnelSegmentStore } from "./funnel-segment-store.js";
import { newFunnelSegment } from "./funnel-segment.js";

test("MemoryFunnelSegmentStore finds what it saved", () => {
  const store = newMemoryFunnelSegmentStore();
  const item = newFunnelSegment("code-38", "label-907");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
