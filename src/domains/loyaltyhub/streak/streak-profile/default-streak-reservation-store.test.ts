import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryDefaultStreakReservationStore } from "./default-streak-reservation-store.js";
import { newDefaultStreakReservation } from "./default-streak-reservation.js";

test("MemoryDefaultStreakReservationStore finds what it saved", () => {
  const store = newMemoryDefaultStreakReservationStore();
  const item = newDefaultStreakReservation("code-534", "name-832");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
