import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryPacingProposalStore } from "./pacing-proposal-store.js";
import { newPacingProposal } from "./pacing-proposal.js";

test("MemoryPacingProposalStore finds what it saved", () => {
  const store = newMemoryPacingProposalStore();
  const item = newPacingProposal("code-294", "label-193");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
