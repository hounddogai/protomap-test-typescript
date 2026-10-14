import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemorySlaProposalStore } from "./sla-proposal-store.js";
import { newSlaProposal } from "./sla-proposal.js";

test("MemorySlaProposalStore finds what it saved", () => {
  const store = newMemorySlaProposalStore();
  const item = newSlaProposal("code-440", "name-119");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
