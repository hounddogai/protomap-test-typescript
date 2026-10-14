import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryLenientReputationProposalStore } from "./lenient-reputation-proposal-store.js";
import { newLenientReputationProposal } from "./lenient-reputation-proposal.js";

test("MemoryLenientReputationProposalStore finds what it saved", () => {
  const store = newMemoryLenientReputationProposalStore();
  const item = newLenientReputationProposal("code-852", "label-360");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
