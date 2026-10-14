import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryScheduledConversionReservationStore } from "./scheduled-conversion-reservation-store.js";
import { newScheduledConversionReservation } from "./scheduled-conversion-reservation.js";

test("MemoryScheduledConversionReservationStore finds what it saved", () => {
  const store = newMemoryScheduledConversionReservationStore();
  const item = newScheduledConversionReservation("code-326", "label-21");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
