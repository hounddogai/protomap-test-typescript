import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultPlacementAdjustmentEngine } from "./placement-adjustment-engine.js";
import { newPlacementAdjustment } from "./placement-adjustment.js";

test("PlacementAdjustmentEngine keeps results within bounds", () => {
  const engine = defaultPlacementAdjustmentEngine(flags.newRegistry());
  const item = newPlacementAdjustment("code-852", "label-552");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
