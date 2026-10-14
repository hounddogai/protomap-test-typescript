import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryManualMentionClaimStore } from "./manual-mention-claim-store.js";
import { newManualMentionClaim } from "./manual-mention-claim.js";

test("MemoryManualMentionClaimStore finds what it saved", () => {
  const store = newMemoryManualMentionClaimStore();
  const item = newManualMentionClaim("code-668", "name-917");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
