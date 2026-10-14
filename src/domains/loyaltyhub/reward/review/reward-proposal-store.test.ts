import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryRewardProposalStore } from "./reward-proposal-store.js";
import { newRewardProposal } from "./reward-proposal.js";

test("MemoryRewardProposalStore finds what it saved", () => {
  const store = newMemoryRewardProposalStore();
  const item = newRewardProposal("code-19", "name-809");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
