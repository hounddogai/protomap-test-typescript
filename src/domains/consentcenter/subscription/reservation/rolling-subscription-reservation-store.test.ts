import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryRollingSubscriptionReservationStore } from "./rolling-subscription-reservation-store.js";
import { newRollingSubscriptionReservation } from "./rolling-subscription-reservation.js";

test("MemoryRollingSubscriptionReservationStore finds what it saved", () => {
  const store = newMemoryRollingSubscriptionReservationStore();
  const item = newRollingSubscriptionReservation("code-637", "name-833");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
