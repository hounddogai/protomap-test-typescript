import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryGlobalBounceReservationStore } from "./global-bounce-reservation-store.js";
import { newGlobalBounceReservation } from "./global-bounce-reservation.js";

test("MemoryGlobalBounceReservationStore finds what it saved", () => {
  const store = newMemoryGlobalBounceReservationStore();
  const item = newGlobalBounceReservation("code-902", "label-374");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
