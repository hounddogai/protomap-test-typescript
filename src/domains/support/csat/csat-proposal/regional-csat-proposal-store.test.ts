import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryRegionalCsatProposalStore } from "./regional-csat-proposal-store.js";
import { newRegionalCsatProposal } from "./regional-csat-proposal.js";

test("MemoryRegionalCsatProposalStore finds what it saved", () => {
  const store = newMemoryRegionalCsatProposalStore();
  const item = newRegionalCsatProposal("code-636", "label-121");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
