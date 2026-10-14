import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultProofAdjustmentEngine } from "./proof-adjustment-engine.js";
import { newProofAdjustment } from "./proof-adjustment.js";

test("ProofAdjustmentEngine keeps results within bounds", () => {
  const engine = defaultProofAdjustmentEngine(flags.newRegistry());
  const item = newProofAdjustment("code-603", "title-264");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
