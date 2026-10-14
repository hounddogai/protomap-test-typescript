import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultWeightedProofDraftEngine } from "./weighted-proof-draft-engine.js";
import { newWeightedProofDraft } from "./weighted-proof-draft.js";

test("WeightedProofDraftEngine keeps results within bounds", () => {
  const engine = defaultWeightedProofDraftEngine(flags.newRegistry());
  const item = newWeightedProofDraft("code-832", "label-284");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
