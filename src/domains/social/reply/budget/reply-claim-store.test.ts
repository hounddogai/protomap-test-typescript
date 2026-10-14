import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryReplyClaimStore } from "./reply-claim-store.js";
import { newReplyClaim } from "./reply-claim.js";

test("MemoryReplyClaimStore finds what it saved", () => {
  const store = newMemoryReplyClaimStore();
  const item = newReplyClaim("code-249", "name-713");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
