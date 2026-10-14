import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryRedemptionReservationStore } from "./redemption-reservation-store.js";
import { newRedemptionReservation } from "./redemption-reservation.js";

test("MemoryRedemptionReservationStore finds what it saved", () => {
  const store = newMemoryRedemptionReservationStore();
  const item = newRedemptionReservation("code-659", "title-300");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
