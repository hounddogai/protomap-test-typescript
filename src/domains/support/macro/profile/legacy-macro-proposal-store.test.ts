import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryLegacyMacroProposalStore } from "./legacy-macro-proposal-store.js";
import { newLegacyMacroProposal } from "./legacy-macro-proposal.js";

test("MemoryLegacyMacroProposalStore finds what it saved", () => {
  const store = newMemoryLegacyMacroProposalStore();
  const item = newLegacyMacroProposal("code-975", "name-875");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
