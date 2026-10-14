import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryCreativeProposalStore } from "./creative-proposal-store.js";
import { newCreativeProposal } from "./creative-proposal.js";

test("MemoryCreativeProposalStore finds what it saved", () => {
  const store = newMemoryCreativeProposalStore();
  const item = newCreativeProposal("code-984", "name-594");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
