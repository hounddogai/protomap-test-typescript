import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryDefaultPreferenceReservationStore } from "./default-preference-reservation-store.js";
import { newDefaultPreferenceReservation } from "./default-preference-reservation.js";

test("MemoryDefaultPreferenceReservationStore finds what it saved", () => {
  const store = newMemoryDefaultPreferenceReservationStore();
  const item = newDefaultPreferenceReservation("code-37", "label-615");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
