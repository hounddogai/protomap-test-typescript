import assert from "node:assert/strict";
import { test } from "node:test";
import { toStrictTicketViewBatchView, toStrictTicketViewBatchViews } from "./strict-ticket-view-batch-view.js";
import { newStrictTicketViewBatch } from "./strict-ticket-view-batch.js";

test("StrictTicketViewBatchView shows the status in capitals", () => {
  const item = newStrictTicketViewBatch("code-360", "name-617");
  const view = toStrictTicketViewBatchView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toStrictTicketViewBatchViews([item, item]).length, 2, "views");
});
