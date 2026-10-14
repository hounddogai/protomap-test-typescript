import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryLegacyDoubleOptInReservationStore } from "./legacy-double-opt-in-reservation-store.js";
import { newLegacyDoubleOptInReservation } from "./legacy-double-opt-in-reservation.js";

test("MemoryLegacyDoubleOptInReservationStore finds what it saved", () => {
  const store = newMemoryLegacyDoubleOptInReservationStore();
  const item = newLegacyDoubleOptInReservation("code-968", "title-58");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
