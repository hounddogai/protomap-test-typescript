import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultWaitProposalEngine } from "./wait-proposal-engine.js";
import { newWaitProposal } from "./wait-proposal.js";

test("WaitProposalEngine keeps results within bounds", () => {
  const engine = defaultWaitProposalEngine();
  const item = newWaitProposal("code-943", "name-671");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
