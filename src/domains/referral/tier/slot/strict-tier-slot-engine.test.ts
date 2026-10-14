import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultStrictTierSlotEngine } from "./strict-tier-slot-engine.js";
import { newStrictTierSlot } from "./strict-tier-slot.js";

test("StrictTierSlotEngine keeps results within bounds", () => {
  const engine = defaultStrictTierSlotEngine(flags.newRegistry());
  const item = newStrictTierSlot("code-659", "label-161");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
