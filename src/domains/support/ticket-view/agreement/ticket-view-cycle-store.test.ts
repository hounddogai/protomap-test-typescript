import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryTicketViewCycleStore } from "./ticket-view-cycle-store.js";
import { newTicketViewCycle } from "./ticket-view-cycle.js";

test("MemoryTicketViewCycleStore finds what it saved", () => {
  const store = newMemoryTicketViewCycleStore();
  const item = newTicketViewCycle("code-996", "title-556");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
