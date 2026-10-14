import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultBadgeSlotEngine } from "./badge-slot-engine.js";
import { newBadgeSlot } from "./badge-slot.js";

test("BadgeSlotEngine keeps results within bounds", () => {
  const engine = defaultBadgeSlotEngine(flags.newRegistry());
  const item = newBadgeSlot("code-49", "label-44");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
