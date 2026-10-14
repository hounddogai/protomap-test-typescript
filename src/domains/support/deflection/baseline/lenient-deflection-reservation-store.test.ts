import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryLenientDeflectionReservationStore } from "./lenient-deflection-reservation-store.js";
import { newLenientDeflectionReservation } from "./lenient-deflection-reservation.js";

test("MemoryLenientDeflectionReservationStore finds what it saved", () => {
  const store = newMemoryLenientDeflectionReservationStore();
  const item = newLenientDeflectionReservation("code-427", "label-967");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
