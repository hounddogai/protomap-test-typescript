import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryStrictSenderProposalStore } from "./strict-sender-proposal-store.js";
import { newStrictSenderProposal } from "./strict-sender-proposal.js";

test("MemoryStrictSenderProposalStore finds what it saved", () => {
  const store = newMemoryStrictSenderProposalStore();
  const item = newStrictSenderProposal("code-381", "name-745");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
