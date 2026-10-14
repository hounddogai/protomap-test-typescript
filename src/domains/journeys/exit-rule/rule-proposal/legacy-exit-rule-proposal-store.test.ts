import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryLegacyExitRuleProposalStore } from "./legacy-exit-rule-proposal-store.js";
import { newLegacyExitRuleProposal } from "./legacy-exit-rule-proposal.js";

test("MemoryLegacyExitRuleProposalStore finds what it saved", () => {
  const store = newMemoryLegacyExitRuleProposalStore();
  const item = newLegacyExitRuleProposal("code-734", "title-175");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
