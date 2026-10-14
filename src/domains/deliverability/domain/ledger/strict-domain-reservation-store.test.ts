import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryStrictDomainReservationStore } from "./strict-domain-reservation-store.js";
import { newStrictDomainReservation } from "./strict-domain-reservation.js";

test("MemoryStrictDomainReservationStore finds what it saved", () => {
  const store = newMemoryStrictDomainReservationStore();
  const item = newStrictDomainReservation("code-890", "name-204");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
