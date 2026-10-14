import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryPendingConversionReservationStore } from "./pending-conversion-reservation-store.js";
import { newPendingConversionReservation } from "./pending-conversion-reservation.js";

test("MemoryPendingConversionReservationStore finds what it saved", () => {
  const store = newMemoryPendingConversionReservationStore();
  const item = newPendingConversionReservation("code-952", "label-725");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
