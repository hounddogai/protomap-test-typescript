import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryCappedSuppressionProposalStore } from "./capped-suppression-proposal-store.js";
import { newCappedSuppressionProposal } from "./capped-suppression-proposal.js";

test("MemoryCappedSuppressionProposalStore finds what it saved", () => {
  const store = newMemoryCappedSuppressionProposalStore();
  const item = newCappedSuppressionProposal("code-977", "label-938");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
