import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultWeightedProofRollupEngine } from "./weighted-proof-rollup-engine.js";
import { newWeightedProofRollup } from "./weighted-proof-rollup.js";

test("WeightedProofRollupEngine keeps results within bounds", () => {
  const engine = defaultWeightedProofRollupEngine(flags.newRegistry());
  const item = newWeightedProofRollup("code-366", "name-348");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
