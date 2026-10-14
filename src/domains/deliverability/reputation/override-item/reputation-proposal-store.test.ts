import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryReputationProposalStore } from "./reputation-proposal-store.js";
import { newReputationProposal } from "./reputation-proposal.js";

test("MemoryReputationProposalStore finds what it saved", () => {
  const store = newMemoryReputationProposalStore();
  const item = newReputationProposal("code-997", "label-137");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
