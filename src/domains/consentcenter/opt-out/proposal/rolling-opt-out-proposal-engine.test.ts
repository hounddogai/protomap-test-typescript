import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultRollingOptOutProposalEngine } from "./rolling-opt-out-proposal-engine.js";
import { newRollingOptOutProposal } from "./rolling-opt-out-proposal.js";

test("RollingOptOutProposalEngine keeps results within bounds", () => {
  const engine = defaultRollingOptOutProposalEngine(flags.newRegistry());
  const item = newRollingOptOutProposal("code-803", "title-710");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
