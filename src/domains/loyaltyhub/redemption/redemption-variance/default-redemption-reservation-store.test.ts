import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryDefaultRedemptionReservationStore } from "./default-redemption-reservation-store.js";
import { newDefaultRedemptionReservation } from "./default-redemption-reservation.js";

test("MemoryDefaultRedemptionReservationStore finds what it saved", () => {
  const store = newMemoryDefaultRedemptionReservationStore();
  const item = newDefaultRedemptionReservation("code-576", "label-322");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
