import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryPrimarySlaReservationStore } from "./primary-sla-reservation-store.js";
import { newPrimarySlaReservation } from "./primary-sla-reservation.js";

test("MemoryPrimarySlaReservationStore finds what it saved", () => {
  const store = newMemoryPrimarySlaReservationStore();
  const item = newPrimarySlaReservation("code-549", "name-380");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
