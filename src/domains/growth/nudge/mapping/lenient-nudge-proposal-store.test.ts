import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryLenientNudgeProposalStore } from "./lenient-nudge-proposal-store.js";
import { newLenientNudgeProposal } from "./lenient-nudge-proposal.js";

test("MemoryLenientNudgeProposalStore finds what it saved", () => {
  const store = newMemoryLenientNudgeProposalStore();
  const item = newLenientNudgeProposal("code-837", "name-42");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
