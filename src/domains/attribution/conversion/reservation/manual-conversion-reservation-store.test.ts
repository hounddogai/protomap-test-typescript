import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryManualConversionReservationStore } from "./manual-conversion-reservation-store.js";
import { newManualConversionReservation } from "./manual-conversion-reservation.js";

test("MemoryManualConversionReservationStore finds what it saved", () => {
  const store = newMemoryManualConversionReservationStore();
  const item = newManualConversionReservation("code-815", "name-666");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
