import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryFallbackPreferenceProposalStore } from "./fallback-preference-proposal-store.js";
import { newFallbackPreferenceProposal } from "./fallback-preference-proposal.js";

test("MemoryFallbackPreferenceProposalStore finds what it saved", () => {
  const store = newMemoryFallbackPreferenceProposalStore();
  const item = newFallbackPreferenceProposal("code-749", "title-702");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
