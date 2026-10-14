import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryBatchedPacingProposalStore } from "./batched-pacing-proposal-store.js";
import { newBatchedPacingProposal } from "./batched-pacing-proposal.js";

test("MemoryBatchedPacingProposalStore finds what it saved", () => {
  const store = newMemoryBatchedPacingProposalStore();
  const item = newBatchedPacingProposal("code-282", "title-57");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
