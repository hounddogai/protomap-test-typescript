import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryRollingActivationReservationStore } from "./rolling-activation-reservation-store.js";
import { newRollingActivationReservation } from "./rolling-activation-reservation.js";

test("MemoryRollingActivationReservationStore finds what it saved", () => {
  const store = newMemoryRollingActivationReservationStore();
  const item = newRollingActivationReservation("code-64", "label-773");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
