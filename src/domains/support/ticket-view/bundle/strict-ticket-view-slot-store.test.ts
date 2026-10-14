import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryStrictTicketViewSlotStore } from "./strict-ticket-view-slot-store.js";
import { newStrictTicketViewSlot } from "./strict-ticket-view-slot.js";

test("MemoryStrictTicketViewSlotStore finds what it saved", () => {
  const store = newMemoryStrictTicketViewSlotStore();
  const item = newStrictTicketViewSlot("code-519", "name-836");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
