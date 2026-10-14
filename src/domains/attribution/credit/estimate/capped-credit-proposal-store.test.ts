import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryCappedCreditProposalStore } from "./capped-credit-proposal-store.js";
import { newCappedCreditProposal } from "./capped-credit-proposal.js";

test("MemoryCappedCreditProposalStore finds what it saved", () => {
  const store = newMemoryCappedCreditProposalStore();
  const item = newCappedCreditProposal("code-537", "name-341");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
