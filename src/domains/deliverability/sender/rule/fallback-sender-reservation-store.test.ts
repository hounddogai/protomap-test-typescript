import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryFallbackSenderReservationStore } from "./fallback-sender-reservation-store.js";
import { newFallbackSenderReservation } from "./fallback-sender-reservation.js";

test("MemoryFallbackSenderReservationStore finds what it saved", () => {
  const store = newMemoryFallbackSenderReservationStore();
  const item = newFallbackSenderReservation("code-583", "title-531");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
