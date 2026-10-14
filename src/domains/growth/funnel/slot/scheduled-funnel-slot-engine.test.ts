import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultScheduledFunnelSlotEngine } from "./scheduled-funnel-slot-engine.js";
import { newScheduledFunnelSlot } from "./scheduled-funnel-slot.js";

test("ScheduledFunnelSlotEngine keeps results within bounds", () => {
  const engine = defaultScheduledFunnelSlotEngine();
  const item = newScheduledFunnelSlot("code-933", "title-517");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
