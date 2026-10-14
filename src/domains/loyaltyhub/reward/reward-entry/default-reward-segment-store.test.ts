import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryDefaultRewardSegmentStore } from "./default-reward-segment-store.js";
import { newDefaultRewardSegment } from "./default-reward-segment.js";

test("MemoryDefaultRewardSegmentStore finds what it saved", () => {
  const store = newMemoryDefaultRewardSegmentStore();
  const item = newDefaultRewardSegment("code-464", "title-301");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
