import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultTieredPlacementSlotEngine } from "./tiered-placement-slot-engine.js";
import { newTieredPlacementSlot } from "./tiered-placement-slot.js";

test("TieredPlacementSlotEngine keeps results within bounds", () => {
  const engine = defaultTieredPlacementSlotEngine(flags.newRegistry());
  const item = newTieredPlacementSlot("code-23", "name-543");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
