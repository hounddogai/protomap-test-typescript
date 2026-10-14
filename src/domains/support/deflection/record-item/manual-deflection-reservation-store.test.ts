import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryManualDeflectionReservationStore } from "./manual-deflection-reservation-store.js";
import { newManualDeflectionReservation } from "./manual-deflection-reservation.js";

test("MemoryManualDeflectionReservationStore finds what it saved", () => {
  const store = newMemoryManualDeflectionReservationStore();
  const item = newManualDeflectionReservation("code-799", "title-340");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
