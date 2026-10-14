import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultPendingRewardProposalEngine } from "./pending-reward-proposal-engine.js";
import { newPendingRewardProposal } from "./pending-reward-proposal.js";

test("PendingRewardProposalEngine keeps results within bounds", () => {
  const engine = defaultPendingRewardProposalEngine(flags.newRegistry());
  const item = newPendingRewardProposal("code-589", "name-568");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
