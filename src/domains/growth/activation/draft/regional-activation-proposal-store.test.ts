import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryRegionalActivationProposalStore } from "./regional-activation-proposal-store.js";
import { newRegionalActivationProposal } from "./regional-activation-proposal.js";

test("MemoryRegionalActivationProposalStore finds what it saved", () => {
  const store = newMemoryRegionalActivationProposalStore();
  const item = newRegionalActivationProposal("code-430", "label-928");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
