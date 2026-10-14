import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryPendingFrequencyProposalStore } from "./pending-frequency-proposal-store.js";
import { newPendingFrequencyProposal } from "./pending-frequency-proposal.js";

test("MemoryPendingFrequencyProposalStore finds what it saved", () => {
  const store = newMemoryPendingFrequencyProposalStore();
  const item = newPendingFrequencyProposal("code-274", "name-424");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
