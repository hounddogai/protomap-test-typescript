import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryScheduledPayoutReservationStore } from "./scheduled-payout-reservation-store.js";
import { newScheduledPayoutReservation } from "./scheduled-payout-reservation.js";

test("MemoryScheduledPayoutReservationStore finds what it saved", () => {
  const store = newMemoryScheduledPayoutReservationStore();
  const item = newScheduledPayoutReservation("code-380", "label-14");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
