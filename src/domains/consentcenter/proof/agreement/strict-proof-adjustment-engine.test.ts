import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultStrictProofAdjustmentEngine } from "./strict-proof-adjustment-engine.js";
import { newStrictProofAdjustment } from "./strict-proof-adjustment.js";

test("StrictProofAdjustmentEngine keeps results within bounds", () => {
  const engine = defaultStrictProofAdjustmentEngine();
  const item = newStrictProofAdjustment("code-788", "title-279");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
