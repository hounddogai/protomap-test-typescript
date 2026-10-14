import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryRewardReservationStore } from "./reward-reservation-store.js";
import { newRewardReservation } from "./reward-reservation.js";

test("MemoryRewardReservationStore finds what it saved", () => {
  const store = newMemoryRewardReservationStore();
  const item = newRewardReservation("code-483", "name-962");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
