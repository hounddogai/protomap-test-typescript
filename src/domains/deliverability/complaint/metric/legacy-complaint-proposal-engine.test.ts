import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultLegacyComplaintProposalEngine } from "./legacy-complaint-proposal-engine.js";
import { newLegacyComplaintProposal } from "./legacy-complaint-proposal.js";

test("LegacyComplaintProposalEngine keeps results within bounds", () => {
  const engine = defaultLegacyComplaintProposalEngine();
  const item = newLegacyComplaintProposal("code-368", "label-167");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
