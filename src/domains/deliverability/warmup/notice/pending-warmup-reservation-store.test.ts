import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryPendingWarmupReservationStore } from "./pending-warmup-reservation-store.js";
import { newPendingWarmupReservation } from "./pending-warmup-reservation.js";

test("MemoryPendingWarmupReservationStore finds what it saved", () => {
  const store = newMemoryPendingWarmupReservationStore();
  const item = newPendingWarmupReservation("code-506", "title-366");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
