import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryPreferenceProposalStore } from "./preference-proposal-store.js";
import { newPreferenceProposal } from "./preference-proposal.js";

test("MemoryPreferenceProposalStore finds what it saved", () => {
  const store = newMemoryPreferenceProposalStore();
  const item = newPreferenceProposal("code-909", "name-994");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
