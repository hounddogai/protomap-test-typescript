import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryLenientReplyClaimStore } from "./lenient-reply-claim-store.js";
import { newLenientReplyClaim } from "./lenient-reply-claim.js";

test("MemoryLenientReplyClaimStore finds what it saved", () => {
  const store = newMemoryLenientReplyClaimStore();
  const item = newLenientReplyClaim("code-923", "label-218");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
