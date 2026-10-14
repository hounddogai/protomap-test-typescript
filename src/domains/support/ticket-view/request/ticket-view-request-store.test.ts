import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryTicketViewRequestStore } from "./ticket-view-request-store.js";
import { newTicketViewRequest } from "./ticket-view-request.js";

test("MemoryTicketViewRequestStore finds what it saved", () => {
  const store = newMemoryTicketViewRequestStore();
  const item = newTicketViewRequest("code-723", "label-723");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
