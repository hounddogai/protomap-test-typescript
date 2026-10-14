import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryExitRuleReservationStore } from "./exit-rule-reservation-store.js";
import { newExitRuleReservation } from "./exit-rule-reservation.js";

test("MemoryExitRuleReservationStore finds what it saved", () => {
  const store = newMemoryExitRuleReservationStore();
  const item = newExitRuleReservation("code-346", "name-216");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
