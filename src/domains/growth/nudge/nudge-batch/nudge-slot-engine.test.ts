import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultNudgeSlotEngine } from "./nudge-slot-engine.js";
import { newNudgeSlot } from "./nudge-slot.js";

test("NudgeSlotEngine keeps results within bounds", () => {
  const engine = defaultNudgeSlotEngine(flags.newRegistry());
  const item = newNudgeSlot("code-101", "name-257");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
