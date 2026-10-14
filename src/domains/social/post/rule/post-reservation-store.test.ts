import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryPostReservationStore } from "./post-reservation-store.js";
import { newPostReservation } from "./post-reservation.js";

test("MemoryPostReservationStore finds what it saved", () => {
  const store = newMemoryPostReservationStore();
  const item = newPostReservation("code-911", "title-522");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
