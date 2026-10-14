import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryTicketViewSummaryStore } from "./ticket-view-summary-store.js";
import { newTicketViewSummary } from "./ticket-view-summary.js";

test("MemoryTicketViewSummaryStore finds what it saved", () => {
  const store = newMemoryTicketViewSummaryStore();
  const item = newTicketViewSummary("code-33", "title-499");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
