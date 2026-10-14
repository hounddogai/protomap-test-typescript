import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultLenientCreditProposalEngine } from "./lenient-credit-proposal-engine.js";
import { newLenientCreditProposal } from "./lenient-credit-proposal.js";

test("LenientCreditProposalEngine keeps results within bounds", () => {
  const engine = defaultLenientCreditProposalEngine(flags.newRegistry());
  const item = newLenientCreditProposal("code-125", "title-10");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
