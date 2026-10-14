import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultManualRetentionProposalEngine } from "./manual-retention-proposal-engine.js";
import { newManualRetentionProposal } from "./manual-retention-proposal.js";

test("ManualRetentionProposalEngine keeps results within bounds", () => {
  const engine = defaultManualRetentionProposalEngine();
  const item = newManualRetentionProposal("code-197", "title-453");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
