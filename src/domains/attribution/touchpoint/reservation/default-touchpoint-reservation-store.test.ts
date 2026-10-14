import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryDefaultTouchpointReservationStore } from "./default-touchpoint-reservation-store.js";
import { newDefaultTouchpointReservation } from "./default-touchpoint-reservation.js";

test("MemoryDefaultTouchpointReservationStore finds what it saved", () => {
  const store = newMemoryDefaultTouchpointReservationStore();
  const item = newDefaultTouchpointReservation("code-134", "label-564");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
