import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemorySlaReservationStore } from "./sla-reservation-store.js";
import { newSlaReservation } from "./sla-reservation.js";

test("MemorySlaReservationStore finds what it saved", () => {
  const store = newMemorySlaReservationStore();
  const item = newSlaReservation("code-403", "name-950");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
