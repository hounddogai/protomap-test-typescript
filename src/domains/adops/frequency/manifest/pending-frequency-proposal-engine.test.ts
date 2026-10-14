import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultPendingFrequencyProposalEngine } from "./pending-frequency-proposal-engine.js";
import { newPendingFrequencyProposal } from "./pending-frequency-proposal.js";

test("PendingFrequencyProposalEngine keeps results within bounds", () => {
  const engine = defaultPendingFrequencyProposalEngine(flags.newRegistry());
  const item = newPendingFrequencyProposal("code-274", "name-424");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
