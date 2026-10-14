import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultDefaultBadgeSlotEngine } from "./default-badge-slot-engine.js";
import { newDefaultBadgeSlot } from "./default-badge-slot.js";

test("DefaultBadgeSlotEngine keeps results within bounds", () => {
  const engine = defaultDefaultBadgeSlotEngine(flags.newRegistry());
  const item = newDefaultBadgeSlot("code-894", "name-77");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
