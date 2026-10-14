import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryManualRetentionProposalStore } from "./manual-retention-proposal-store.js";
import { newManualRetentionProposal } from "./manual-retention-proposal.js";

test("MemoryManualRetentionProposalStore finds what it saved", () => {
  const store = newMemoryManualRetentionProposalStore();
  const item = newManualRetentionProposal("code-197", "title-453");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
