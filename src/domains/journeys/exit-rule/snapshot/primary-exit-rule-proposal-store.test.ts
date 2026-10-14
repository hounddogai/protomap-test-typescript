import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryPrimaryExitRuleProposalStore } from "./primary-exit-rule-proposal-store.js";
import { newPrimaryExitRuleProposal } from "./primary-exit-rule-proposal.js";

test("MemoryPrimaryExitRuleProposalStore finds what it saved", () => {
  const store = newMemoryPrimaryExitRuleProposalStore();
  const item = newPrimaryExitRuleProposal("code-466", "name-288");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
