import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryWarmupProposalStore } from "./warmup-proposal-store.js";
import { newWarmupProposal } from "./warmup-proposal.js";

test("MemoryWarmupProposalStore finds what it saved", () => {
  const store = newMemoryWarmupProposalStore();
  const item = newWarmupProposal("code-210", "label-146");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
