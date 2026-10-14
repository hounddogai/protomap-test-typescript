import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryScheduledStepProposalStore } from "./scheduled-step-proposal-store.js";
import { newScheduledStepProposal } from "./scheduled-step-proposal.js";

test("MemoryScheduledStepProposalStore finds what it saved", () => {
  const store = newMemoryScheduledStepProposalStore();
  const item = newScheduledStepProposal("code-753", "title-787");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
