import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryBadgeReservationStore } from "./badge-reservation-store.js";
import { newBadgeReservation } from "./badge-reservation.js";

test("MemoryBadgeReservationStore finds what it saved", () => {
  const store = newMemoryBadgeReservationStore();
  const item = newBadgeReservation("code-265", "label-133");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
