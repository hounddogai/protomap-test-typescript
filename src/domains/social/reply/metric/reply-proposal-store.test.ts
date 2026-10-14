import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryReplyProposalStore } from "./reply-proposal-store.js";
import { newReplyProposal } from "./reply-proposal.js";

test("MemoryReplyProposalStore finds what it saved", () => {
  const store = newMemoryReplyProposalStore();
  const item = newReplyProposal("code-442", "name-933");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
