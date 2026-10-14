import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultPacingProposalEngine } from "./pacing-proposal-engine.js";
import { newPacingProposal } from "./pacing-proposal.js";

test("PacingProposalEngine keeps results within bounds", () => {
  const engine = defaultPacingProposalEngine();
  const item = newPacingProposal("code-294", "label-193");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
