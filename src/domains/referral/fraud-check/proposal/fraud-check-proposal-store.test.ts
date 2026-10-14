import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryFraudCheckProposalStore } from "./fraud-check-proposal-store.js";
import { newFraudCheckProposal } from "./fraud-check-proposal.js";

test("MemoryFraudCheckProposalStore finds what it saved", () => {
  const store = newMemoryFraudCheckProposalStore();
  const item = newFraudCheckProposal("code-990", "label-343");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
