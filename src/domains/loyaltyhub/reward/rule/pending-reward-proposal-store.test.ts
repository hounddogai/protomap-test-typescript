import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryPendingRewardProposalStore } from "./pending-reward-proposal-store.js";
import { newPendingRewardProposal } from "./pending-reward-proposal.js";

test("MemoryPendingRewardProposalStore finds what it saved", () => {
  const store = newMemoryPendingRewardProposalStore();
  const item = newPendingRewardProposal("code-589", "name-568");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
