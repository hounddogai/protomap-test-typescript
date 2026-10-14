import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryPrimaryCreditReservationStore } from "./primary-credit-reservation-store.js";
import { newPrimaryCreditReservation } from "./primary-credit-reservation.js";

test("MemoryPrimaryCreditReservationStore finds what it saved", () => {
  const store = newMemoryPrimaryCreditReservationStore();
  const item = newPrimaryCreditReservation("code-378", "name-234");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
