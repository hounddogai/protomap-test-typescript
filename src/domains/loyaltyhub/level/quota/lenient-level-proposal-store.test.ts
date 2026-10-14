import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryLenientLevelProposalStore } from "./lenient-level-proposal-store.js";
import { newLenientLevelProposal } from "./lenient-level-proposal.js";

test("MemoryLenientLevelProposalStore finds what it saved", () => {
  const store = newMemoryLenientLevelProposalStore();
  const item = newLenientLevelProposal("code-653", "label-259");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
