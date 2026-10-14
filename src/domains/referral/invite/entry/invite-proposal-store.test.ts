import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryInviteProposalStore } from "./invite-proposal-store.js";
import { newInviteProposal } from "./invite-proposal.js";

test("MemoryInviteProposalStore finds what it saved", () => {
  const store = newMemoryInviteProposalStore();
  const item = newInviteProposal("code-958", "title-311");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
