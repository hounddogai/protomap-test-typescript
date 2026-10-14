import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryLegacyFlightReservationStore } from "./legacy-flight-reservation-store.js";
import { newLegacyFlightReservation } from "./legacy-flight-reservation.js";

test("MemoryLegacyFlightReservationStore finds what it saved", () => {
  const store = newMemoryLegacyFlightReservationStore();
  const item = newLegacyFlightReservation("code-643", "label-102");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
