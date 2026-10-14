import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryInviteSegmentStore } from "./invite-segment-store.js";
import { newInviteSegment } from "./invite-segment.js";

test("MemoryInviteSegmentStore finds what it saved", () => {
  const store = newMemoryInviteSegmentStore();
  const item = newInviteSegment("code-710", "title-986");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
