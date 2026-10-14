import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultTierSlotEngine } from "./tier-slot-engine.js";
import { newTierSlot } from "./tier-slot.js";

test("TierSlotEngine keeps results within bounds", () => {
  const engine = defaultTierSlotEngine(flags.newRegistry());
  const item = newTierSlot("code-707", "label-532");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
