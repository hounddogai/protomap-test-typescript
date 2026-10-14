import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryTouchpointProposalStore } from "./touchpoint-proposal-store.js";
import { newTouchpointProposal } from "./touchpoint-proposal.js";

test("MemoryTouchpointProposalStore finds what it saved", () => {
  const store = newMemoryTouchpointProposalStore();
  const item = newTouchpointProposal("code-301", "name-423");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
