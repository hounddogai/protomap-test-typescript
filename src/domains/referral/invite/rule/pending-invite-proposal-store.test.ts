import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryPendingInviteProposalStore } from "./pending-invite-proposal-store.js";
import { newPendingInviteProposal } from "./pending-invite-proposal.js";

test("MemoryPendingInviteProposalStore finds what it saved", () => {
  const store = newMemoryPendingInviteProposalStore();
  const item = newPendingInviteProposal("code-176", "title-578");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
