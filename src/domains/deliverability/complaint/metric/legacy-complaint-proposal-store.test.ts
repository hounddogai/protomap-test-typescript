import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryLegacyComplaintProposalStore } from "./legacy-complaint-proposal-store.js";
import { newLegacyComplaintProposal } from "./legacy-complaint-proposal.js";

test("MemoryLegacyComplaintProposalStore finds what it saved", () => {
  const store = newMemoryLegacyComplaintProposalStore();
  const item = newLegacyComplaintProposal("code-368", "label-167");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
