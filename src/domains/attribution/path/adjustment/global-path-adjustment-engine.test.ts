import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultGlobalPathAdjustmentEngine } from "./global-path-adjustment-engine.js";
import { newGlobalPathAdjustment } from "./global-path-adjustment.js";

test("GlobalPathAdjustmentEngine keeps results within bounds", () => {
  const engine = defaultGlobalPathAdjustmentEngine(flags.newRegistry());
  const item = newGlobalPathAdjustment("code-259", "label-856");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
