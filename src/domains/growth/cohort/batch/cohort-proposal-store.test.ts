import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryCohortProposalStore } from "./cohort-proposal-store.js";
import { newCohortProposal } from "./cohort-proposal.js";

test("MemoryCohortProposalStore finds what it saved", () => {
  const store = newMemoryCohortProposalStore();
  const item = newCohortProposal("code-168", "title-711");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
