import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultStrictMacroProposalEngine } from "./strict-macro-proposal-engine.js";
import { newStrictMacroProposal } from "./strict-macro-proposal.js";

test("StrictMacroProposalEngine keeps results within bounds", () => {
  const engine = defaultStrictMacroProposalEngine(flags.newRegistry());
  const item = newStrictMacroProposal("code-440", "name-120");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
