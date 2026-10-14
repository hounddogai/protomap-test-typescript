import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryWeightedTicketViewCycleStore } from "./weighted-ticket-view-cycle-store.js";
import { newWeightedTicketViewCycle } from "./weighted-ticket-view-cycle.js";

test("MemoryWeightedTicketViewCycleStore finds what it saved", () => {
  const store = newMemoryWeightedTicketViewCycleStore();
  const item = newWeightedTicketViewCycle("code-819", "label-198");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
