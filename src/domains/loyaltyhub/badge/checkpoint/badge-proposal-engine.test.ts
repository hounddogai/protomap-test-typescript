import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultBadgeProposalEngine } from "./badge-proposal-engine.js";
import { newBadgeProposal } from "./badge-proposal.js";

test("BadgeProposalEngine keeps results within bounds", () => {
  const engine = defaultBadgeProposalEngine();
  const item = newBadgeProposal("code-244", "title-23");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
