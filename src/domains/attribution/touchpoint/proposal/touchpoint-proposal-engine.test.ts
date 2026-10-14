import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultTouchpointProposalEngine } from "./touchpoint-proposal-engine.js";
import { newTouchpointProposal } from "./touchpoint-proposal.js";

test("TouchpointProposalEngine keeps results within bounds", () => {
  const engine = defaultTouchpointProposalEngine();
  const item = newTouchpointProposal("code-301", "name-423");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
