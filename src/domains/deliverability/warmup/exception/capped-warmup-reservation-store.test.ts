import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryCappedWarmupReservationStore } from "./capped-warmup-reservation-store.js";
import { newCappedWarmupReservation } from "./capped-warmup-reservation.js";

test("MemoryCappedWarmupReservationStore finds what it saved", () => {
  const store = newMemoryCappedWarmupReservationStore();
  const item = newCappedWarmupReservation("code-746", "name-824");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
