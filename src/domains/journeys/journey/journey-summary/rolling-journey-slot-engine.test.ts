import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultRollingJourneySlotEngine } from "./rolling-journey-slot-engine.js";
import { newRollingJourneySlot } from "./rolling-journey-slot.js";

test("RollingJourneySlotEngine keeps results within bounds", () => {
  const engine = defaultRollingJourneySlotEngine(flags.newRegistry());
  const item = newRollingJourneySlot("code-788", "label-858");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
