import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryOptOutProposalStore } from "./opt-out-proposal-store.js";
import { newOptOutProposal } from "./opt-out-proposal.js";

test("MemoryOptOutProposalStore finds what it saved", () => {
  const store = newMemoryOptOutProposalStore();
  const item = newOptOutProposal("code-483", "label-898");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
