import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemorySeasonalLevelProposalStore } from "./seasonal-level-proposal-store.js";
import { newSeasonalLevelProposal } from "./seasonal-level-proposal.js";

test("MemorySeasonalLevelProposalStore finds what it saved", () => {
  const store = newMemorySeasonalLevelProposalStore();
  const item = newSeasonalLevelProposal("code-234", "title-655");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
