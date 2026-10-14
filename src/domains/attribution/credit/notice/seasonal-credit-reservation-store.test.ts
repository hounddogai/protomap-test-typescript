import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemorySeasonalCreditReservationStore } from "./seasonal-credit-reservation-store.js";
import { newSeasonalCreditReservation } from "./seasonal-credit-reservation.js";

test("MemorySeasonalCreditReservationStore finds what it saved", () => {
  const store = newMemorySeasonalCreditReservationStore();
  const item = newSeasonalCreditReservation("code-874", "label-759");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
