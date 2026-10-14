import assert from "node:assert/strict";
import { test } from "node:test";
import { toTicketViewSegmentView, toTicketViewSegmentViews } from "./ticket-view-segment-view.js";
import { newTicketViewSegment } from "./ticket-view-segment.js";

test("TicketViewSegmentView shows the status in capitals", () => {
  const item = newTicketViewSegment("code-326", "label-833");
  const view = toTicketViewSegmentView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toTicketViewSegmentViews([item, item]).length, 2, "views");
});
