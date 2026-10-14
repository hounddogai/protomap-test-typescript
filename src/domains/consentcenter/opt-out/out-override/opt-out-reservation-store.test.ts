import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryOptOutReservationStore } from "./opt-out-reservation-store.js";
import { newOptOutReservation } from "./opt-out-reservation.js";

test("MemoryOptOutReservationStore finds what it saved", () => {
  const store = newMemoryOptOutReservationStore();
  const item = newOptOutReservation("code-81", "label-107");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
