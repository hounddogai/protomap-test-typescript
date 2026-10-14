import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryFunnelProposalStore } from "./funnel-proposal-store.js";
import { newFunnelProposal } from "./funnel-proposal.js";

test("MemoryFunnelProposalStore finds what it saved", () => {
  const store = newMemoryFunnelProposalStore();
  const item = newFunnelProposal("code-738", "label-450");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
