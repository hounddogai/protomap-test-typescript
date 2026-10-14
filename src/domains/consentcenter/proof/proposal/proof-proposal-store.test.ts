import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryProofProposalStore } from "./proof-proposal-store.js";
import { newProofProposal } from "./proof-proposal.js";

test("MemoryProofProposalStore finds what it saved", () => {
  const store = newMemoryProofProposalStore();
  const item = newProofProposal("code-310", "title-791");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
