import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryTieredLevelReservationStore } from "./tiered-level-reservation-store.js";
import { newTieredLevelReservation } from "./tiered-level-reservation.js";

test("MemoryTieredLevelReservationStore finds what it saved", () => {
  const store = newMemoryTieredLevelReservationStore();
  const item = newTieredLevelReservation("code-46", "title-257");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
