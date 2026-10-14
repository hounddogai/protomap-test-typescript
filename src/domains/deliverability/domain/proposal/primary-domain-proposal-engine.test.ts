import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultPrimaryDomainProposalEngine } from "./primary-domain-proposal-engine.js";
import { newPrimaryDomainProposal } from "./primary-domain-proposal.js";

test("PrimaryDomainProposalEngine keeps results within bounds", () => {
  const engine = defaultPrimaryDomainProposalEngine();
  const item = newPrimaryDomainProposal("code-773", "label-874");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
