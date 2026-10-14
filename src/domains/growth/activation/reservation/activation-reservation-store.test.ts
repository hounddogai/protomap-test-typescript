import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryActivationReservationStore } from "./activation-reservation-store.js";
import { newActivationReservation } from "./activation-reservation.js";

test("MemoryActivationReservationStore finds what it saved", () => {
  const store = newMemoryActivationReservationStore();
  const item = newActivationReservation("code-797", "label-798");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
