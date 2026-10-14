import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryDoubleOptInProposalStore } from "./double-opt-in-proposal-store.js";
import { newDoubleOptInProposal } from "./double-opt-in-proposal.js";

test("MemoryDoubleOptInProposalStore finds what it saved", () => {
  const store = newMemoryDoubleOptInProposalStore();
  const item = newDoubleOptInProposal("code-537", "title-254");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
