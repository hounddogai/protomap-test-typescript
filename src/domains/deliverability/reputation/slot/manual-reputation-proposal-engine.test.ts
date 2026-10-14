import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultManualReputationProposalEngine } from "./manual-reputation-proposal-engine.js";
import { newManualReputationProposal } from "./manual-reputation-proposal.js";

test("ManualReputationProposalEngine keeps results within bounds", () => {
  const engine = defaultManualReputationProposalEngine(flags.newRegistry());
  const item = newManualReputationProposal("code-483", "name-414");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
