import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryApprovalReservationStore } from "./approval-reservation-store.js";
import { newApprovalReservation } from "./approval-reservation.js";

test("MemoryApprovalReservationStore finds what it saved", () => {
  const store = newMemoryApprovalReservationStore();
  const item = newApprovalReservation("code-509", "title-530");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
