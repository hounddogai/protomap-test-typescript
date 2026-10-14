import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryRegionalSubscriptionReservationStore } from "./regional-subscription-reservation-store.js";
import { newRegionalSubscriptionReservation } from "./regional-subscription-reservation.js";

test("MemoryRegionalSubscriptionReservationStore finds what it saved", () => {
  const store = newMemoryRegionalSubscriptionReservationStore();
  const item = newRegionalSubscriptionReservation("code-113", "title-29");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
