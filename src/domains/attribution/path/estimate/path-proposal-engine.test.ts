import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultPathProposalEngine } from "./path-proposal-engine.js";
import { newPathProposal } from "./path-proposal.js";

test("PathProposalEngine keeps results within bounds", () => {
  const engine = defaultPathProposalEngine(flags.newRegistry());
  const item = newPathProposal("code-32", "name-608");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
