import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryWeightedComplaintReservationStore } from "./weighted-complaint-reservation-store.js";
import { newWeightedComplaintReservation } from "./weighted-complaint-reservation.js";

test("MemoryWeightedComplaintReservationStore finds what it saved", () => {
  const store = newMemoryWeightedComplaintReservationStore();
  const item = newWeightedComplaintReservation("code-303", "name-771");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
