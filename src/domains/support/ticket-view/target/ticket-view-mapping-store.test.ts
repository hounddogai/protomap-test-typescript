import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryTicketViewMappingStore } from "./ticket-view-mapping-store.js";
import { newTicketViewMapping } from "./ticket-view-mapping.js";

test("MemoryTicketViewMappingStore finds what it saved", () => {
  const store = newMemoryTicketViewMappingStore();
  const item = newTicketViewMapping("code-87", "title-328");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
