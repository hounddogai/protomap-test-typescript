import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultPendingInviteSlotEngine } from "./pending-invite-slot-engine.js";
import { newPendingInviteSlot } from "./pending-invite-slot.js";

test("PendingInviteSlotEngine keeps results within bounds", () => {
  const engine = defaultPendingInviteSlotEngine();
  const item = newPendingInviteSlot("code-759", "title-762");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
