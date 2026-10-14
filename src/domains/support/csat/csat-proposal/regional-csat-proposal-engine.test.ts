import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultRegionalCsatProposalEngine } from "./regional-csat-proposal-engine.js";
import { newRegionalCsatProposal } from "./regional-csat-proposal.js";

test("RegionalCsatProposalEngine keeps results within bounds", () => {
  const engine = defaultRegionalCsatProposalEngine(flags.newRegistry());
  const item = newRegionalCsatProposal("code-636", "label-121");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
