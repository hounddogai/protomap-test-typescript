import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultSeasonalBadgeSlotEngine } from "./seasonal-badge-slot-engine.js";
import { newSeasonalBadgeSlot } from "./seasonal-badge-slot.js";

test("SeasonalBadgeSlotEngine keeps results within bounds", () => {
  const engine = defaultSeasonalBadgeSlotEngine();
  const item = newSeasonalBadgeSlot("code-38", "name-638");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
