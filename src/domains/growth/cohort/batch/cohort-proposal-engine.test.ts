import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultCohortProposalEngine } from "./cohort-proposal-engine.js";
import { newCohortProposal } from "./cohort-proposal.js";

test("CohortProposalEngine keeps results within bounds", () => {
  const engine = defaultCohortProposalEngine();
  const item = newCohortProposal("code-168", "title-711");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
