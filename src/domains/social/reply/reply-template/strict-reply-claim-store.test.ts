import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryStrictReplyClaimStore } from "./strict-reply-claim-store.js";
import { newStrictReplyClaim } from "./strict-reply-claim.js";

test("MemoryStrictReplyClaimStore finds what it saved", () => {
  const store = newMemoryStrictReplyClaimStore();
  const item = newStrictReplyClaim("code-828", "title-735");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
