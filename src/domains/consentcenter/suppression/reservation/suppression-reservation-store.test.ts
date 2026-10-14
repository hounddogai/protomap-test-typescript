import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemorySuppressionReservationStore } from "./suppression-reservation-store.js";
import { newSuppressionReservation } from "./suppression-reservation.js";

test("MemorySuppressionReservationStore finds what it saved", () => {
  const store = newMemorySuppressionReservationStore();
  const item = newSuppressionReservation("code-86", "label-211");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
