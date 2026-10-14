import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultLenientInsightSlotEngine } from "./lenient-insight-slot-engine.js";
import { newLenientInsightSlot } from "./lenient-insight-slot.js";

test("LenientInsightSlotEngine keeps results within bounds", () => {
  const engine = defaultLenientInsightSlotEngine(flags.newRegistry());
  const item = newLenientInsightSlot("code-302", "title-263");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
