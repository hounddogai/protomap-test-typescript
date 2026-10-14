import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryStrictReplyProposalStore } from "./strict-reply-proposal-store.js";
import { newStrictReplyProposal } from "./strict-reply-proposal.js";

test("MemoryStrictReplyProposalStore finds what it saved", () => {
  const store = newMemoryStrictReplyProposalStore();
  const item = newStrictReplyProposal("code-710", "title-445");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
