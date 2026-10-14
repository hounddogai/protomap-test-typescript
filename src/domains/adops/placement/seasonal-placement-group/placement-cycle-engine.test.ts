import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultPlacementCycleEngine } from "./placement-cycle-engine.js";
import { newPlacementCycle } from "./placement-cycle.js";

test("PlacementCycleEngine keeps results within bounds", () => {
  const engine = defaultPlacementCycleEngine(flags.newRegistry());
  const item = newPlacementCycle("code-499", "name-741");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
