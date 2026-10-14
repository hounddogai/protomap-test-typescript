import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryLegacyTicketViewSummaryStore } from "./legacy-ticket-view-summary-store.js";
import { newLegacyTicketViewSummary } from "./legacy-ticket-view-summary.js";

test("MemoryLegacyTicketViewSummaryStore finds what it saved", () => {
  const store = newMemoryLegacyTicketViewSummaryStore();
  const item = newLegacyTicketViewSummary("code-178", "title-234");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
