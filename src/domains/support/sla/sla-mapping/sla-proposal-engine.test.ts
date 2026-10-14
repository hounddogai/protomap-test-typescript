import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultSlaProposalEngine } from "./sla-proposal-engine.js";
import { newSlaProposal } from "./sla-proposal.js";

test("SlaProposalEngine keeps results within bounds", () => {
  const engine = defaultSlaProposalEngine(flags.newRegistry());
  const item = newSlaProposal("code-440", "name-119");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
