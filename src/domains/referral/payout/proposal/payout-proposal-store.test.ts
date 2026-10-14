import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryPayoutProposalStore } from "./payout-proposal-store.js";
import { newPayoutProposal } from "./payout-proposal.js";

test("MemoryPayoutProposalStore finds what it saved", () => {
  const store = newMemoryPayoutProposalStore();
  const item = newPayoutProposal("code-689", "name-477");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
