import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultPendingEscalationSlotEngine } from "./pending-escalation-slot-engine.js";
import { newPendingEscalationSlot } from "./pending-escalation-slot.js";

test("PendingEscalationSlotEngine keeps results within bounds", () => {
  const engine = defaultPendingEscalationSlotEngine(flags.newRegistry());
  const item = newPendingEscalationSlot("code-971", "title-101");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
