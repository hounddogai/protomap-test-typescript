import assert from "node:assert/strict";
import { test } from "node:test";
import { toTicketViewBatchView, toTicketViewBatchViews } from "./ticket-view-batch-view.js";
import { newTicketViewBatch } from "./ticket-view-batch.js";

test("TicketViewBatchView shows the status in capitals", () => {
  const item = newTicketViewBatch("code-16", "title-314");
  const view = toTicketViewBatchView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toTicketViewBatchViews([item, item]).length, 2, "views");
});
