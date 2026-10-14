import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryFallbackSuppressionReservationStore } from "./fallback-suppression-reservation-store.js";
import { newFallbackSuppressionReservation } from "./fallback-suppression-reservation.js";

test("MemoryFallbackSuppressionReservationStore finds what it saved", () => {
  const store = newMemoryFallbackSuppressionReservationStore();
  const item = newFallbackSuppressionReservation("code-239", "label-64");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
