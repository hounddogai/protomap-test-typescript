import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryDoubleOptInReservationStore } from "./double-opt-in-reservation-store.js";
import { newDoubleOptInReservation } from "./double-opt-in-reservation.js";

test("MemoryDoubleOptInReservationStore finds what it saved", () => {
  const store = newMemoryDoubleOptInReservationStore();
  const item = newDoubleOptInReservation("code-607", "name-403");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
