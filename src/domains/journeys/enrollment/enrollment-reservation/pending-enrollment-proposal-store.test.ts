import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryPendingEnrollmentProposalStore } from "./pending-enrollment-proposal-store.js";
import { newPendingEnrollmentProposal } from "./pending-enrollment-proposal.js";

test("MemoryPendingEnrollmentProposalStore finds what it saved", () => {
  const store = newMemoryPendingEnrollmentProposalStore();
  const item = newPendingEnrollmentProposal("code-716", "name-259");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
