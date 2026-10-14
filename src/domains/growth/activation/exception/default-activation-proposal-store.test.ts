import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryDefaultActivationProposalStore } from "./default-activation-proposal-store.js";
import { newDefaultActivationProposal } from "./default-activation-proposal.js";

test("MemoryDefaultActivationProposalStore finds what it saved", () => {
  const store = newMemoryDefaultActivationProposalStore();
  const item = newDefaultActivationProposal("code-593", "title-483");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
