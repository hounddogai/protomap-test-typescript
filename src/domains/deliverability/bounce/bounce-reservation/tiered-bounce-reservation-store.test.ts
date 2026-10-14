import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryTieredBounceReservationStore } from "./tiered-bounce-reservation-store.js";
import { newTieredBounceReservation } from "./tiered-bounce-reservation.js";

test("MemoryTieredBounceReservationStore finds what it saved", () => {
  const store = newMemoryTieredBounceReservationStore();
  const item = newTieredBounceReservation("code-137", "label-219");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
