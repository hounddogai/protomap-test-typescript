import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryPayoutReservationStore } from "./payout-reservation-store.js";
import { newPayoutReservation } from "./payout-reservation.js";

test("MemoryPayoutReservationStore finds what it saved", () => {
  const store = newMemoryPayoutReservationStore();
  const item = newPayoutReservation("code-238", "title-237");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
