import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryWeightedRedemptionProposalStore } from "./weighted-redemption-proposal-store.js";
import { newWeightedRedemptionProposal } from "./weighted-redemption-proposal.js";

test("MemoryWeightedRedemptionProposalStore finds what it saved", () => {
  const store = newMemoryWeightedRedemptionProposalStore();
  const item = newWeightedRedemptionProposal("code-231", "label-787");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
