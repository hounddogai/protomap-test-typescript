import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryDefaultComplaintReservationStore } from "./default-complaint-reservation-store.js";
import { newDefaultComplaintReservation } from "./default-complaint-reservation.js";

test("MemoryDefaultComplaintReservationStore finds what it saved", () => {
  const store = newMemoryDefaultComplaintReservationStore();
  const item = newDefaultComplaintReservation("code-83", "title-137");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
