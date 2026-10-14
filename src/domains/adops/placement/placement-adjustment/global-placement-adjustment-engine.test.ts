import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultGlobalPlacementAdjustmentEngine } from "./global-placement-adjustment-engine.js";
import { newGlobalPlacementAdjustment } from "./global-placement-adjustment.js";

test("GlobalPlacementAdjustmentEngine keeps results within bounds", () => {
  const engine = defaultGlobalPlacementAdjustmentEngine(flags.newRegistry());
  const item = newGlobalPlacementAdjustment("code-499", "title-68");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
