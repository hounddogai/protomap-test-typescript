import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryDomainProposalStore } from "./domain-proposal-store.js";
import { newDomainProposal } from "./domain-proposal.js";

test("MemoryDomainProposalStore finds what it saved", () => {
  const store = newMemoryDomainProposalStore();
  const item = newDomainProposal("code-919", "title-533");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
