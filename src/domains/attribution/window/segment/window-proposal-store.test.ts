import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryWindowProposalStore } from "./window-proposal-store.js";
import { newWindowProposal } from "./window-proposal.js";

test("MemoryWindowProposalStore finds what it saved", () => {
  const store = newMemoryWindowProposalStore();
  const item = newWindowProposal("code-511", "title-250");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
