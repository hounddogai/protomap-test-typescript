import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryConversionProposalStore } from "./conversion-proposal-store.js";
import { newConversionProposal } from "./conversion-proposal.js";

test("MemoryConversionProposalStore finds what it saved", () => {
  const store = newMemoryConversionProposalStore();
  const item = newConversionProposal("code-329", "title-356");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
