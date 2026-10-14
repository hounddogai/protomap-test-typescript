import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultManualWindowProposalEngine } from "./manual-window-proposal-engine.js";
import { newManualWindowProposal } from "./manual-window-proposal.js";

test("ManualWindowProposalEngine keeps results within bounds", () => {
  const engine = defaultManualWindowProposalEngine();
  const item = newManualWindowProposal("code-127", "label-34");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
