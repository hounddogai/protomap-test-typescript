import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultGlobalChallengeProposalEngine } from "./global-challenge-proposal-engine.js";
import { newGlobalChallengeProposal } from "./global-challenge-proposal.js";

test("GlobalChallengeProposalEngine keeps results within bounds", () => {
  const engine = defaultGlobalChallengeProposalEngine(flags.newRegistry());
  const item = newGlobalChallengeProposal("code-215", "name-711");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
