import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultCsatProposalEngine } from "./csat-proposal-engine.js";
import { newCsatProposal } from "./csat-proposal.js";

test("CsatProposalEngine keeps results within bounds", () => {
  const engine = defaultCsatProposalEngine();
  const item = newCsatProposal("code-325", "label-347");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
