import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryTieredReputationProposalStore } from "./tiered-reputation-proposal-store.js";
import { newTieredReputationProposal } from "./tiered-reputation-proposal.js";

test("MemoryTieredReputationProposalStore finds what it saved", () => {
  const store = newMemoryTieredReputationProposalStore();
  const item = newTieredReputationProposal("code-816", "name-41");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
