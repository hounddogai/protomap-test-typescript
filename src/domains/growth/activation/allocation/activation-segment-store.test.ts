import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryActivationSegmentStore } from "./activation-segment-store.js";
import { newActivationSegment } from "./activation-segment.js";

test("MemoryActivationSegmentStore finds what it saved", () => {
  const store = newMemoryActivationSegmentStore();
  const item = newActivationSegment("code-922", "label-584");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
