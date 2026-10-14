import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultDomainProposalEngine } from "./domain-proposal-engine.js";
import { newDomainProposal } from "./domain-proposal.js";

test("DomainProposalEngine keeps results within bounds", () => {
  const engine = defaultDomainProposalEngine(flags.newRegistry());
  const item = newDomainProposal("code-919", "title-533");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
