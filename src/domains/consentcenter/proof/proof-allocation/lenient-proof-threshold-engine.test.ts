import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultLenientProofThresholdEngine } from "./lenient-proof-threshold-engine.js";
import { newLenientProofThreshold } from "./lenient-proof-threshold.js";

test("LenientProofThresholdEngine keeps results within bounds", () => {
  const engine = defaultLenientProofThresholdEngine();
  const item = newLenientProofThreshold("code-981", "title-444");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
