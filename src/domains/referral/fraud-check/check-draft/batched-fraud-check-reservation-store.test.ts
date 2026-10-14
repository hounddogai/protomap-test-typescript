import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryBatchedFraudCheckReservationStore } from "./batched-fraud-check-reservation-store.js";
import { newBatchedFraudCheckReservation } from "./batched-fraud-check-reservation.js";

test("MemoryBatchedFraudCheckReservationStore finds what it saved", () => {
  const store = newMemoryBatchedFraudCheckReservationStore();
  const item = newBatchedFraudCheckReservation("code-395", "title-679");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
