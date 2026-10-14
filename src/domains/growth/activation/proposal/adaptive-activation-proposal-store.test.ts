import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryAdaptiveActivationProposalStore } from "./adaptive-activation-proposal-store.js";
import { newAdaptiveActivationProposal } from "./adaptive-activation-proposal.js";

test("MemoryAdaptiveActivationProposalStore finds what it saved", () => {
  const store = newMemoryAdaptiveActivationProposalStore();
  const item = newAdaptiveActivationProposal("code-774", "label-979");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
