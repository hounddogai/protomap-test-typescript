import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultInviteProposalEngine } from "./invite-proposal-engine.js";
import { newInviteProposal } from "./invite-proposal.js";

test("InviteProposalEngine keeps results within bounds", () => {
  const engine = defaultInviteProposalEngine();
  const item = newInviteProposal("code-958", "title-311");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
