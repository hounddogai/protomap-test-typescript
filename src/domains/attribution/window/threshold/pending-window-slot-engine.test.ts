import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultPendingWindowSlotEngine } from "./pending-window-slot-engine.js";
import { newPendingWindowSlot } from "./pending-window-slot.js";

test("PendingWindowSlotEngine keeps results within bounds", () => {
  const engine = defaultPendingWindowSlotEngine();
  const item = newPendingWindowSlot("code-625", "name-631");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
