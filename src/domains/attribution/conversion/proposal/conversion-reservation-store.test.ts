import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryConversionReservationStore } from "./conversion-reservation-store.js";
import { newConversionReservation } from "./conversion-reservation.js";

test("MemoryConversionReservationStore finds what it saved", () => {
  const store = newMemoryConversionReservationStore();
  const item = newConversionReservation("code-344", "name-620");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
