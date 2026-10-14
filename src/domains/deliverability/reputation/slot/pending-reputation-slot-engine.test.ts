import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultPendingReputationSlotEngine } from "./pending-reputation-slot-engine.js";
import { newPendingReputationSlot } from "./pending-reputation-slot.js";

test("PendingReputationSlotEngine keeps results within bounds", () => {
  const engine = defaultPendingReputationSlotEngine(flags.newRegistry());
  const item = newPendingReputationSlot("code-591", "label-842");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
