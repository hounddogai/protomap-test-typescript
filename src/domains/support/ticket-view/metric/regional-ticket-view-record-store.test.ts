import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryRegionalTicketViewRecordStore } from "./regional-ticket-view-record-store.js";
import { newRegionalTicketViewRecord } from "./regional-ticket-view-record.js";

test("MemoryRegionalTicketViewRecordStore finds what it saved", () => {
  const store = newMemoryRegionalTicketViewRecordStore();
  const item = newRegionalTicketViewRecord("code-655", "name-766");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
