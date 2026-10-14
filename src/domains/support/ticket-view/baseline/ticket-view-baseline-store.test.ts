import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryTicketViewBaselineStore } from "./ticket-view-baseline-store.js";
import { newTicketViewBaseline } from "./ticket-view-baseline.js";

test("MemoryTicketViewBaselineStore finds what it saved", () => {
  const store = newMemoryTicketViewBaselineStore();
  const item = newTicketViewBaseline("code-638", "name-998");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
