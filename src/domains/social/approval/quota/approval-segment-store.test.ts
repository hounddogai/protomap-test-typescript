import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryApprovalSegmentStore } from "./approval-segment-store.js";
import { newApprovalSegment } from "./approval-segment.js";

test("MemoryApprovalSegmentStore finds what it saved", () => {
  const store = newMemoryApprovalSegmentStore();
  const item = newApprovalSegment("code-203", "name-288");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
