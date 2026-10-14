import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryInviteReservationStore } from "./invite-reservation-store.js";
import { newInviteReservation } from "./invite-reservation.js";

test("MemoryInviteReservationStore finds what it saved", () => {
  const store = newMemoryInviteReservationStore();
  const item = newInviteReservation("code-230", "title-52");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
