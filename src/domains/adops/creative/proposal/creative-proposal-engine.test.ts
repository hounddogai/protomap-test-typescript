import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultCreativeProposalEngine } from "./creative-proposal-engine.js";
import { newCreativeProposal } from "./creative-proposal.js";

test("CreativeProposalEngine keeps results within bounds", () => {
  const engine = defaultCreativeProposalEngine();
  const item = newCreativeProposal("code-984", "name-594");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
