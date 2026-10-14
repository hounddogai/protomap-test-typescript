import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryEnrollmentReservationStore } from "./enrollment-reservation-store.js";
import { newEnrollmentReservation } from "./enrollment-reservation.js";

test("MemoryEnrollmentReservationStore finds what it saved", () => {
  const store = newMemoryEnrollmentReservationStore();
  const item = newEnrollmentReservation("code-340", "title-401");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
