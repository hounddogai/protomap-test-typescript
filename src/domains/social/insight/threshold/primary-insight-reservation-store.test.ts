import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryPrimaryInsightReservationStore } from "./primary-insight-reservation-store.js";
import { newPrimaryInsightReservation } from "./primary-insight-reservation.js";

test("MemoryPrimaryInsightReservationStore finds what it saved", () => {
  const store = newMemoryPrimaryInsightReservationStore();
  const item = newPrimaryInsightReservation("code-87", "name-108");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
