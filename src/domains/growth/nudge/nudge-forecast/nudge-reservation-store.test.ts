import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryNudgeReservationStore } from "./nudge-reservation-store.js";
import { newNudgeReservation } from "./nudge-reservation.js";

test("MemoryNudgeReservationStore finds what it saved", () => {
  const store = newMemoryNudgeReservationStore();
  const item = newNudgeReservation("code-395", "title-37");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
