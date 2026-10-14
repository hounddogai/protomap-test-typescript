import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultPayoutProposalEngine } from "./payout-proposal-engine.js";
import { newPayoutProposal } from "./payout-proposal.js";

test("PayoutProposalEngine keeps results within bounds", () => {
  const engine = defaultPayoutProposalEngine();
  const item = newPayoutProposal("code-689", "name-477");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
