import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultPendingBadgeSlotEngine } from "./pending-badge-slot-engine.js";
import { newPendingBadgeSlot } from "./pending-badge-slot.js";

test("PendingBadgeSlotEngine keeps results within bounds", () => {
  const engine = defaultPendingBadgeSlotEngine();
  const item = newPendingBadgeSlot("code-884", "label-552");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
