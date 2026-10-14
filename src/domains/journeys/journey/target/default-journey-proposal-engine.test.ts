import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultDefaultJourneyProposalEngine } from "./default-journey-proposal-engine.js";
import { newDefaultJourneyProposal } from "./default-journey-proposal.js";

test("DefaultJourneyProposalEngine keeps results within bounds", () => {
  const engine = defaultDefaultJourneyProposalEngine(flags.newRegistry());
  const item = newDefaultJourneyProposal("code-654", "label-21");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
