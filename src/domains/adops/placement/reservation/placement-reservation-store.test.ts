import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryPlacementReservationStore } from "./placement-reservation-store.js";
import { newPlacementReservation } from "./placement-reservation.js";

test("MemoryPlacementReservationStore finds what it saved", () => {
  const store = newMemoryPlacementReservationStore();
  const item = newPlacementReservation("code-709", "label-338");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
