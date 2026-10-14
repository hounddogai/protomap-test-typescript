import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultPendingInviteProposalEngine } from "./pending-invite-proposal-engine.js";
import { newPendingInviteProposal } from "./pending-invite-proposal.js";

test("PendingInviteProposalEngine keeps results within bounds", () => {
  const engine = defaultPendingInviteProposalEngine();
  const item = newPendingInviteProposal("code-176", "title-578");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
