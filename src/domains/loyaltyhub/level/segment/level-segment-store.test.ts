import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryLevelSegmentStore } from "./level-segment-store.js";
import { newLevelSegment } from "./level-segment.js";

test("MemoryLevelSegmentStore finds what it saved", () => {
  const store = newMemoryLevelSegmentStore();
  const item = newLevelSegment("code-54", "label-625");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
