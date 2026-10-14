import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryBatchedDeflectionReservationStore } from "./batched-deflection-reservation-store.js";
import { newBatchedDeflectionReservation } from "./batched-deflection-reservation.js";

test("MemoryBatchedDeflectionReservationStore finds what it saved", () => {
  const store = newMemoryBatchedDeflectionReservationStore();
  const item = newBatchedDeflectionReservation("code-542", "label-599");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
