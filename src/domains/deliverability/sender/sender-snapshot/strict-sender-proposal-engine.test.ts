import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultStrictSenderProposalEngine } from "./strict-sender-proposal-engine.js";
import { newStrictSenderProposal } from "./strict-sender-proposal.js";

test("StrictSenderProposalEngine keeps results within bounds", () => {
  const engine = defaultStrictSenderProposalEngine();
  const item = newStrictSenderProposal("code-381", "name-745");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
