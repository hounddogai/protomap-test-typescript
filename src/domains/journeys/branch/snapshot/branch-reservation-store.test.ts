import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryBranchReservationStore } from "./branch-reservation-store.js";
import { newBranchReservation } from "./branch-reservation.js";

test("MemoryBranchReservationStore finds what it saved", () => {
  const store = newMemoryBranchReservationStore();
  const item = newBranchReservation("code-273", "title-271");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
