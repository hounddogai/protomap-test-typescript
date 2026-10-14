import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryBounceReservationStore } from "./bounce-reservation-store.js";
import { newBounceReservation } from "./bounce-reservation.js";

test("MemoryBounceReservationStore finds what it saved", () => {
  const store = newMemoryBounceReservationStore();
  const item = newBounceReservation("code-516", "title-376");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
