import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryRewardRuleProposalStore } from "./reward-rule-proposal-store.js";
import { newRewardRuleProposal } from "./reward-rule-proposal.js";

test("MemoryRewardRuleProposalStore finds what it saved", () => {
  const store = newMemoryRewardRuleProposalStore();
  const item = newRewardRuleProposal("code-45", "title-963");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
