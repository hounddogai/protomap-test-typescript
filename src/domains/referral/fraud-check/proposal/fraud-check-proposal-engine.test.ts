import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultFraudCheckProposalEngine } from "./fraud-check-proposal-engine.js";
import { newFraudCheckProposal } from "./fraud-check-proposal.js";

test("FraudCheckProposalEngine keeps results within bounds", () => {
  const engine = defaultFraudCheckProposalEngine(flags.newRegistry());
  const item = newFraudCheckProposal("code-990", "label-343");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
