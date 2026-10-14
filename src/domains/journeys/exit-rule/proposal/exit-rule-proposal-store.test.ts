import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryExitRuleProposalStore } from "./exit-rule-proposal-store.js";
import { newExitRuleProposal } from "./exit-rule-proposal.js";

test("MemoryExitRuleProposalStore finds what it saved", () => {
  const store = newMemoryExitRuleProposalStore();
  const item = newExitRuleProposal("code-123", "name-544");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
