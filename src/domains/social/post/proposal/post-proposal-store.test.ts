import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryPostProposalStore } from "./post-proposal-store.js";
import { newPostProposal } from "./post-proposal.js";

test("MemoryPostProposalStore finds what it saved", () => {
  const store = newMemoryPostProposalStore();
  const item = newPostProposal("code-172", "label-787");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
