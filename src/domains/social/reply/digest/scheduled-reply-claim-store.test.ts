import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryScheduledReplyClaimStore } from "./scheduled-reply-claim-store.js";
import { newScheduledReplyClaim } from "./scheduled-reply-claim.js";

test("MemoryScheduledReplyClaimStore finds what it saved", () => {
  const store = newMemoryScheduledReplyClaimStore();
  const item = newScheduledReplyClaim("code-894", "label-954");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
