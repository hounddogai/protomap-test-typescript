import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryRegionalPlacementProposalStore } from "./regional-placement-proposal-store.js";
import { newRegionalPlacementProposal } from "./regional-placement-proposal.js";

test("MemoryRegionalPlacementProposalStore finds what it saved", () => {
  const store = newMemoryRegionalPlacementProposalStore();
  const item = newRegionalPlacementProposal("code-451", "label-688");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
