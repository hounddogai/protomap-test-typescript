import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultTieredInviteSlotEngine } from "./tiered-invite-slot-engine.js";
import { newTieredInviteSlot } from "./tiered-invite-slot.js";

test("TieredInviteSlotEngine keeps results within bounds", () => {
  const engine = defaultTieredInviteSlotEngine(flags.newRegistry());
  const item = newTieredInviteSlot("code-105", "label-86");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
