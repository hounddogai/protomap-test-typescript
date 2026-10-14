import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryGlobalEscalationProposalStore } from "./global-escalation-proposal-store.js";
import { newGlobalEscalationProposal } from "./global-escalation-proposal.js";

test("MemoryGlobalEscalationProposalStore finds what it saved", () => {
  const store = newMemoryGlobalEscalationProposalStore();
  const item = newGlobalEscalationProposal("code-231", "title-341");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
