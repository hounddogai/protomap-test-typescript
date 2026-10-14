import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryLenientCreditProposalStore } from "./lenient-credit-proposal-store.js";
import { newLenientCreditProposal } from "./lenient-credit-proposal.js";

test("MemoryLenientCreditProposalStore finds what it saved", () => {
  const store = newMemoryLenientCreditProposalStore();
  const item = newLenientCreditProposal("code-125", "title-10");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
