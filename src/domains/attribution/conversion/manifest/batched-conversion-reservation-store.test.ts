import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryBatchedConversionReservationStore } from "./batched-conversion-reservation-store.js";
import { newBatchedConversionReservation } from "./batched-conversion-reservation.js";

test("MemoryBatchedConversionReservationStore finds what it saved", () => {
  const store = newMemoryBatchedConversionReservationStore();
  const item = newBatchedConversionReservation("code-74", "title-765");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
