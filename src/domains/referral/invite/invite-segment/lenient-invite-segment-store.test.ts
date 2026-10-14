import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryLenientInviteSegmentStore } from "./lenient-invite-segment-store.js";
import { newLenientInviteSegment } from "./lenient-invite-segment.js";

test("MemoryLenientInviteSegmentStore finds what it saved", () => {
  const store = newMemoryLenientInviteSegmentStore();
  const item = newLenientInviteSegment("code-675", "name-870");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
