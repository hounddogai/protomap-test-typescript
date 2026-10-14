import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryCsatProposalStore } from "./csat-proposal-store.js";
import { newCsatProposal } from "./csat-proposal.js";

test("MemoryCsatProposalStore finds what it saved", () => {
  const store = newMemoryCsatProposalStore();
  const item = newCsatProposal("code-325", "label-347");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
