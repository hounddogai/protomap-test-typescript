import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryRedemptionProposalStore } from "./redemption-proposal-store.js";
import { newRedemptionProposal } from "./redemption-proposal.js";

test("MemoryRedemptionProposalStore finds what it saved", () => {
  const store = newMemoryRedemptionProposalStore();
  const item = newRedemptionProposal("code-209", "label-653");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
