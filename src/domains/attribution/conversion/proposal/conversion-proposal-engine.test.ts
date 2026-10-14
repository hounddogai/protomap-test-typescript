import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultConversionProposalEngine } from "./conversion-proposal-engine.js";
import { newConversionProposal } from "./conversion-proposal.js";

test("ConversionProposalEngine keeps results within bounds", () => {
  const engine = defaultConversionProposalEngine();
  const item = newConversionProposal("code-329", "title-356");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
