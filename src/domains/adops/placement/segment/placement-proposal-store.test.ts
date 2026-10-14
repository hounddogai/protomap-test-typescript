import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryPlacementProposalStore } from "./placement-proposal-store.js";
import { newPlacementProposal } from "./placement-proposal.js";

test("MemoryPlacementProposalStore finds what it saved", () => {
  const store = newMemoryPlacementProposalStore();
  const item = newPlacementProposal("code-956", "title-708");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
