import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryTicketViewReservationStore } from "./ticket-view-reservation-store.js";
import { newTicketViewReservation } from "./ticket-view-reservation.js";

test("MemoryTicketViewReservationStore finds what it saved", () => {
  const store = newMemoryTicketViewReservationStore();
  const item = newTicketViewReservation("code-471", "label-413");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
