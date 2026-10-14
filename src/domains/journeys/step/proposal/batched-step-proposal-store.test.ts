import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryBatchedStepProposalStore } from "./batched-step-proposal-store.js";
import { newBatchedStepProposal } from "./batched-step-proposal.js";

test("MemoryBatchedStepProposalStore finds what it saved", () => {
  const store = newMemoryBatchedStepProposalStore();
  const item = newBatchedStepProposal("code-237", "name-973");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
