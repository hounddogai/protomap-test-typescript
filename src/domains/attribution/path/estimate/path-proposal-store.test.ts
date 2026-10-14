import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryPathProposalStore } from "./path-proposal-store.js";
import { newPathProposal } from "./path-proposal.js";

test("MemoryPathProposalStore finds what it saved", () => {
  const store = newMemoryPathProposalStore();
  const item = newPathProposal("code-32", "name-608");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
