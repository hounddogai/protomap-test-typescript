import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultRegionalTierSlotEngine } from "./regional-tier-slot-engine.js";
import { newRegionalTierSlot } from "./regional-tier-slot.js";

test("RegionalTierSlotEngine keeps results within bounds", () => {
  const engine = defaultRegionalTierSlotEngine();
  const item = newRegionalTierSlot("code-207", "name-499");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
