import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryAdaptiveReplyReservationStore } from "./adaptive-reply-reservation-store.js";
import { newAdaptiveReplyReservation } from "./adaptive-reply-reservation.js";

test("MemoryAdaptiveReplyReservationStore finds what it saved", () => {
  const store = newMemoryAdaptiveReplyReservationStore();
  const item = newAdaptiveReplyReservation("code-441", "title-875");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
