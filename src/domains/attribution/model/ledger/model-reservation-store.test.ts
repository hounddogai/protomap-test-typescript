import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryModelReservationStore } from "./model-reservation-store.js";
import { newModelReservation } from "./model-reservation.js";

test("MemoryModelReservationStore finds what it saved", () => {
  const store = newMemoryModelReservationStore();
  const item = newModelReservation("code-223", "name-924");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
