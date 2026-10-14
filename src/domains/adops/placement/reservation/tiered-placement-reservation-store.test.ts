import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryTieredPlacementReservationStore } from "./tiered-placement-reservation-store.js";
import { newTieredPlacementReservation } from "./tiered-placement-reservation.js";

test("MemoryTieredPlacementReservationStore finds what it saved", () => {
  const store = newMemoryTieredPlacementReservationStore();
  const item = newTieredPlacementReservation("code-491", "title-352");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
