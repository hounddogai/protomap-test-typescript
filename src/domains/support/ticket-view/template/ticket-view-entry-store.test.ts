import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryTicketViewEntryStore } from "./ticket-view-entry-store.js";
import { newTicketViewEntry } from "./ticket-view-entry.js";

test("MemoryTicketViewEntryStore finds what it saved", () => {
  const store = newMemoryTicketViewEntryStore();
  const item = newTicketViewEntry("code-74", "title-421");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
