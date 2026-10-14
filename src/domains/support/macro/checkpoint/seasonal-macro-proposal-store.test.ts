import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemorySeasonalMacroProposalStore } from "./seasonal-macro-proposal-store.js";
import { newSeasonalMacroProposal } from "./seasonal-macro-proposal.js";

test("MemorySeasonalMacroProposalStore finds what it saved", () => {
  const store = newMemorySeasonalMacroProposalStore();
  const item = newSeasonalMacroProposal("code-8", "name-462");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
