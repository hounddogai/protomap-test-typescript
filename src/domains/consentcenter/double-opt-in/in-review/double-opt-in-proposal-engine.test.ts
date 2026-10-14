import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultDoubleOptInProposalEngine } from "./double-opt-in-proposal-engine.js";
import { newDoubleOptInProposal } from "./double-opt-in-proposal.js";

test("DoubleOptInProposalEngine keeps results within bounds", () => {
  const engine = defaultDoubleOptInProposalEngine(flags.newRegistry());
  const item = newDoubleOptInProposal("code-537", "title-254");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
