import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryLenientMentionClaimStore } from "./lenient-mention-claim-store.js";
import { newLenientMentionClaim } from "./lenient-mention-claim.js";

test("MemoryLenientMentionClaimStore finds what it saved", () => {
  const store = newMemoryLenientMentionClaimStore();
  const item = newLenientMentionClaim("code-715", "title-241");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
