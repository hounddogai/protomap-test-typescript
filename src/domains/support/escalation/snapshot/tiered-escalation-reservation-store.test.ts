import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryTieredEscalationReservationStore } from "./tiered-escalation-reservation-store.js";
import { newTieredEscalationReservation } from "./tiered-escalation-reservation.js";

test("MemoryTieredEscalationReservationStore finds what it saved", () => {
  const store = newMemoryTieredEscalationReservationStore();
  const item = newTieredEscalationReservation("code-177", "label-841");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
