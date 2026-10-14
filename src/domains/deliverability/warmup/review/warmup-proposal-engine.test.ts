import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultWarmupProposalEngine } from "./warmup-proposal-engine.js";
import { newWarmupProposal } from "./warmup-proposal.js";

test("WarmupProposalEngine keeps results within bounds", () => {
  const engine = defaultWarmupProposalEngine(flags.newRegistry());
  const item = newWarmupProposal("code-210", "label-146");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
