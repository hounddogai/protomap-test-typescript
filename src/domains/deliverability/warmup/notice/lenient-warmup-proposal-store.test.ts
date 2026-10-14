import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryLenientWarmupProposalStore } from "./lenient-warmup-proposal-store.js";
import { newLenientWarmupProposal } from "./lenient-warmup-proposal.js";

test("MemoryLenientWarmupProposalStore finds what it saved", () => {
  const store = newMemoryLenientWarmupProposalStore();
  const item = newLenientWarmupProposal("code-589", "name-974");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
