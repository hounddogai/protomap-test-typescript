import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryStrictMacroProposalStore } from "./strict-macro-proposal-store.js";
import { newStrictMacroProposal } from "./strict-macro-proposal.js";

test("MemoryStrictMacroProposalStore finds what it saved", () => {
  const store = newMemoryStrictMacroProposalStore();
  const item = newStrictMacroProposal("code-440", "name-120");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
