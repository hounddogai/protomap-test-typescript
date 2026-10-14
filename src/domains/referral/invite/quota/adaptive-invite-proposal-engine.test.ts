import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultAdaptiveInviteProposalEngine } from "./adaptive-invite-proposal-engine.js";
import { newAdaptiveInviteProposal } from "./adaptive-invite-proposal.js";

test("AdaptiveInviteProposalEngine keeps results within bounds", () => {
  const engine = defaultAdaptiveInviteProposalEngine();
  const item = newAdaptiveInviteProposal("code-574", "title-311");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
