import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryPrimaryDomainProposalStore } from "./primary-domain-proposal-store.js";
import { newPrimaryDomainProposal } from "./primary-domain-proposal.js";

test("MemoryPrimaryDomainProposalStore finds what it saved", () => {
  const store = newMemoryPrimaryDomainProposalStore();
  const item = newPrimaryDomainProposal("code-773", "label-874");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
