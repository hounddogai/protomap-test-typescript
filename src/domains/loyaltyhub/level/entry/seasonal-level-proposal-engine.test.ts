import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultSeasonalLevelProposalEngine } from "./seasonal-level-proposal-engine.js";
import { newSeasonalLevelProposal } from "./seasonal-level-proposal.js";

test("SeasonalLevelProposalEngine keeps results within bounds", () => {
  const engine = defaultSeasonalLevelProposalEngine(flags.newRegistry());
  const item = newSeasonalLevelProposal("code-234", "title-655");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
