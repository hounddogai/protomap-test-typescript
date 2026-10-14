import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryRollingNudgeProposalStore } from "./rolling-nudge-proposal-store.js";
import { newRollingNudgeProposal } from "./rolling-nudge-proposal.js";

test("MemoryRollingNudgeProposalStore finds what it saved", () => {
  const store = newMemoryRollingNudgeProposalStore();
  const item = newRollingNudgeProposal("code-737", "title-869");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
