import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultModelAdjustmentEngine } from "./model-adjustment-engine.js";
import { newModelAdjustment } from "./model-adjustment.js";

test("ModelAdjustmentEngine keeps results within bounds", () => {
  const engine = defaultModelAdjustmentEngine(flags.newRegistry());
  const item = newModelAdjustment("code-708", "label-25");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
