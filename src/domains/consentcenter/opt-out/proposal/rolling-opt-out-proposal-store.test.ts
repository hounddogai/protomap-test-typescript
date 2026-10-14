import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryRollingOptOutProposalStore } from "./rolling-opt-out-proposal-store.js";
import { newRollingOptOutProposal } from "./rolling-opt-out-proposal.js";

test("MemoryRollingOptOutProposalStore finds what it saved", () => {
  const store = newMemoryRollingOptOutProposalStore();
  const item = newRollingOptOutProposal("code-803", "title-710");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
