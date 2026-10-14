import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultProofThresholdEngine } from "./proof-threshold-engine.js";
import { newProofThreshold } from "./proof-threshold.js";

test("ProofThresholdEngine keeps results within bounds", () => {
  const engine = defaultProofThresholdEngine();
  const item = newProofThreshold("code-825", "label-840");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
