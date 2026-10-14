import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultSeasonalMacroProposalEngine } from "./seasonal-macro-proposal-engine.js";
import { newSeasonalMacroProposal } from "./seasonal-macro-proposal.js";

test("SeasonalMacroProposalEngine keeps results within bounds", () => {
  const engine = defaultSeasonalMacroProposalEngine(flags.newRegistry());
  const item = newSeasonalMacroProposal("code-8", "name-462");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
