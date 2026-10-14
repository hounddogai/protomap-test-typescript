import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryManualWindowProposalStore } from "./manual-window-proposal-store.js";
import { newManualWindowProposal } from "./manual-window-proposal.js";

test("MemoryManualWindowProposalStore finds what it saved", () => {
  const store = newMemoryManualWindowProposalStore();
  const item = newManualWindowProposal("code-127", "label-34");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
