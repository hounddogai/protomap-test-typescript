import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryEnrollmentProposalStore } from "./enrollment-proposal-store.js";
import { newEnrollmentProposal } from "./enrollment-proposal.js";

test("MemoryEnrollmentProposalStore finds what it saved", () => {
  const store = newMemoryEnrollmentProposalStore();
  const item = newEnrollmentProposal("code-422", "name-246");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
