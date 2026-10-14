import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryAdaptivePlacementProposalStore } from "./adaptive-placement-proposal-store.js";
import { newAdaptivePlacementProposal } from "./adaptive-placement-proposal.js";

test("MemoryAdaptivePlacementProposalStore finds what it saved", () => {
  const store = newMemoryAdaptivePlacementProposalStore();
  const item = newAdaptivePlacementProposal("code-768", "label-434");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
