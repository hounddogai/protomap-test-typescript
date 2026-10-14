import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryEscalationReservationStore } from "./escalation-reservation-store.js";
import { newEscalationReservation } from "./escalation-reservation.js";

test("MemoryEscalationReservationStore finds what it saved", () => {
  const store = newMemoryEscalationReservationStore();
  const item = newEscalationReservation("code-592", "title-970");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
