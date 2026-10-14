import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultStrictReplyProposalEngine } from "./strict-reply-proposal-engine.js";
import { newStrictReplyProposal } from "./strict-reply-proposal.js";

test("StrictReplyProposalEngine keeps results within bounds", () => {
  const engine = defaultStrictReplyProposalEngine();
  const item = newStrictReplyProposal("code-710", "title-445");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
