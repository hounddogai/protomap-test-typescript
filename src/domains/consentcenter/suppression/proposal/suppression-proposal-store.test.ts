import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemorySuppressionProposalStore } from "./suppression-proposal-store.js";
import { newSuppressionProposal } from "./suppression-proposal.js";

test("MemorySuppressionProposalStore finds what it saved", () => {
  const store = newMemorySuppressionProposalStore();
  const item = newSuppressionProposal("code-861", "name-239");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
