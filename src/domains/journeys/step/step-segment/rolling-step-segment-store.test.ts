import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryRollingStepSegmentStore } from "./rolling-step-segment-store.js";
import { newRollingStepSegment } from "./rolling-step-segment.js";

test("MemoryRollingStepSegmentStore finds what it saved", () => {
  const store = newMemoryRollingStepSegmentStore();
  const item = newRollingStepSegment("code-599", "title-229");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
