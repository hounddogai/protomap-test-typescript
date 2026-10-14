import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultPendingPayoutProposalEngine } from "./pending-payout-proposal-engine.js";
import { newPendingPayoutProposal } from "./pending-payout-proposal.js";

test("PendingPayoutProposalEngine keeps results within bounds", () => {
  const engine = defaultPendingPayoutProposalEngine(flags.newRegistry());
  const item = newPendingPayoutProposal("code-61", "label-874");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
