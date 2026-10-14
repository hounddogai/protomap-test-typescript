import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryPendingPayoutProposalStore } from "./pending-payout-proposal-store.js";
import { newPendingPayoutProposal } from "./pending-payout-proposal.js";

test("MemoryPendingPayoutProposalStore finds what it saved", () => {
  const store = newMemoryPendingPayoutProposalStore();
  const item = newPendingPayoutProposal("code-61", "label-874");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
