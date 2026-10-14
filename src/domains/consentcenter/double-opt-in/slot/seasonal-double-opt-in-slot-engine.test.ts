import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultSeasonalDoubleOptInSlotEngine } from "./seasonal-double-opt-in-slot-engine.js";
import { newSeasonalDoubleOptInSlot } from "./seasonal-double-opt-in-slot.js";

test("SeasonalDoubleOptInSlotEngine keeps results within bounds", () => {
  const engine = defaultSeasonalDoubleOptInSlotEngine(flags.newRegistry());
  const item = newSeasonalDoubleOptInSlot("code-758", "name-183");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
