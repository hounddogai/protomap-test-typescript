import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryFallbackNudgeProposalStore } from "./fallback-nudge-proposal-store.js";
import { newFallbackNudgeProposal } from "./fallback-nudge-proposal.js";

test("MemoryFallbackNudgeProposalStore finds what it saved", () => {
  const store = newMemoryFallbackNudgeProposalStore();
  const item = newFallbackNudgeProposal("code-494", "label-888");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
