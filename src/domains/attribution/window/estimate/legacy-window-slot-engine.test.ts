import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultLegacyWindowSlotEngine } from "./legacy-window-slot-engine.js";
import { newLegacyWindowSlot } from "./legacy-window-slot.js";

test("LegacyWindowSlotEngine keeps results within bounds", () => {
  const engine = defaultLegacyWindowSlotEngine(flags.newRegistry());
  const item = newLegacyWindowSlot("code-843", "title-291");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
