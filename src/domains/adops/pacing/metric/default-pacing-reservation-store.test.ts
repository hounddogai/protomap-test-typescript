import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryDefaultPacingReservationStore } from "./default-pacing-reservation-store.js";
import { newDefaultPacingReservation } from "./default-pacing-reservation.js";

test("MemoryDefaultPacingReservationStore finds what it saved", () => {
  const store = newMemoryDefaultPacingReservationStore();
  const item = newDefaultPacingReservation("code-698", "label-87");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
