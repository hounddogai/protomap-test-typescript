import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryInsightReservationStore } from "./insight-reservation-store.js";
import { newInsightReservation } from "./insight-reservation.js";

test("MemoryInsightReservationStore finds what it saved", () => {
  const store = newMemoryInsightReservationStore();
  const item = newInsightReservation("code-527", "title-866");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
