import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryActivationProposalStore } from "./activation-proposal-store.js";
import { newActivationProposal } from "./activation-proposal.js";

test("MemoryActivationProposalStore finds what it saved", () => {
  const store = newMemoryActivationProposalStore();
  const item = newActivationProposal("code-696", "label-541");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
