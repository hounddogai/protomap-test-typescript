import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryWaitProposalStore } from "./wait-proposal-store.js";
import { newWaitProposal } from "./wait-proposal.js";

test("MemoryWaitProposalStore finds what it saved", () => {
  const store = newMemoryWaitProposalStore();
  const item = newWaitProposal("code-943", "name-671");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
