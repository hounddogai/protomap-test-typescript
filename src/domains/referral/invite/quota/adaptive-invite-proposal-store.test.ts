import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryAdaptiveInviteProposalStore } from "./adaptive-invite-proposal-store.js";
import { newAdaptiveInviteProposal } from "./adaptive-invite-proposal.js";

test("MemoryAdaptiveInviteProposalStore finds what it saved", () => {
  const store = newMemoryAdaptiveInviteProposalStore();
  const item = newAdaptiveInviteProposal("code-574", "title-311");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
