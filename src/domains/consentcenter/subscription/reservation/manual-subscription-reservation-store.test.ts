import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryManualSubscriptionReservationStore } from "./manual-subscription-reservation-store.js";
import { newManualSubscriptionReservation } from "./manual-subscription-reservation.js";

test("MemoryManualSubscriptionReservationStore finds what it saved", () => {
  const store = newMemoryManualSubscriptionReservationStore();
  const item = newManualSubscriptionReservation("code-243", "title-274");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
