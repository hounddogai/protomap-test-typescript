import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryCreditReservationStore } from "./credit-reservation-store.js";
import { newCreditReservation } from "./credit-reservation.js";

test("MemoryCreditReservationStore finds what it saved", () => {
  const store = newMemoryCreditReservationStore();
  const item = newCreditReservation("code-353", "title-308");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
