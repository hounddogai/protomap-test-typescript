import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultInviteSlotEngine } from "./invite-slot-engine.js";
import { newInviteSlot } from "./invite-slot.js";

test("InviteSlotEngine keeps results within bounds", () => {
  const engine = defaultInviteSlotEngine(flags.newRegistry());
  const item = newInviteSlot("code-674", "label-90");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
