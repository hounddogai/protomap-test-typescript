import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultAdaptiveStreakProposalEngine } from "./adaptive-streak-proposal-engine.js";
import { newAdaptiveStreakProposal } from "./adaptive-streak-proposal.js";

test("AdaptiveStreakProposalEngine keeps results within bounds", () => {
  const engine = defaultAdaptiveStreakProposalEngine();
  const item = newAdaptiveStreakProposal("code-368", "title-418");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
