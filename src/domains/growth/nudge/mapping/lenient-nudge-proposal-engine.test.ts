import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultLenientNudgeProposalEngine } from "./lenient-nudge-proposal-engine.js";
import { newLenientNudgeProposal } from "./lenient-nudge-proposal.js";

test("LenientNudgeProposalEngine keeps results within bounds", () => {
  const engine = defaultLenientNudgeProposalEngine(flags.newRegistry());
  const item = newLenientNudgeProposal("code-837", "name-42");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
