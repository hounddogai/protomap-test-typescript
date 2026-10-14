import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryAdaptiveTicketViewSummaryStore } from "./adaptive-ticket-view-summary-store.js";
import { newAdaptiveTicketViewSummary } from "./adaptive-ticket-view-summary.js";

test("MemoryAdaptiveTicketViewSummaryStore finds what it saved", () => {
  const store = newMemoryAdaptiveTicketViewSummaryStore();
  const item = newAdaptiveTicketViewSummary("code-38", "label-962");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
