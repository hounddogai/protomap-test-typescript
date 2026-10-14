import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultProofVarianceEngine } from "./proof-variance-engine.js";
import { newProofVariance } from "./proof-variance.js";

test("ProofVarianceEngine keeps results within bounds", () => {
  const engine = defaultProofVarianceEngine(flags.newRegistry());
  const item = newProofVariance("code-658", "name-797");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
