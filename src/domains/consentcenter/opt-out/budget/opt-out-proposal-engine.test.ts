import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultOptOutProposalEngine } from "./opt-out-proposal-engine.js";
import { newOptOutProposal } from "./opt-out-proposal.js";

test("OptOutProposalEngine keeps results within bounds", () => {
  const engine = defaultOptOutProposalEngine();
  const item = newOptOutProposal("code-483", "label-898");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
