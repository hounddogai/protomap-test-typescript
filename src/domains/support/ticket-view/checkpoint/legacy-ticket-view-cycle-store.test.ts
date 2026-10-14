import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryLegacyTicketViewCycleStore } from "./legacy-ticket-view-cycle-store.js";
import { newLegacyTicketViewCycle } from "./legacy-ticket-view-cycle.js";

test("MemoryLegacyTicketViewCycleStore finds what it saved", () => {
  const store = newMemoryLegacyTicketViewCycleStore();
  const item = newLegacyTicketViewCycle("code-95", "name-345");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
