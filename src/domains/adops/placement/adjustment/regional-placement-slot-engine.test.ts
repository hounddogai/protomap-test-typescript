import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultRegionalPlacementSlotEngine } from "./regional-placement-slot-engine.js";
import { newRegionalPlacementSlot } from "./regional-placement-slot.js";

test("RegionalPlacementSlotEngine keeps results within bounds", () => {
  const engine = defaultRegionalPlacementSlotEngine(flags.newRegistry());
  const item = newRegionalPlacementSlot("code-714", "title-928");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
