import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryFunnelReservationStore } from "./funnel-reservation-store.js";
import { newFunnelReservation } from "./funnel-reservation.js";

test("MemoryFunnelReservationStore finds what it saved", () => {
  const store = newMemoryFunnelReservationStore();
  const item = newFunnelReservation("code-923", "name-494");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
