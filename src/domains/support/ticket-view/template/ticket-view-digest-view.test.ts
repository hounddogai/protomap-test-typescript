import assert from "node:assert/strict";
import { test } from "node:test";
import { toTicketViewDigestView, toTicketViewDigestViews } from "./ticket-view-digest-view.js";
import { newTicketViewDigest } from "./ticket-view-digest.js";

test("TicketViewDigestView shows the status in capitals", () => {
  const item = newTicketViewDigest("code-765", "label-390");
  const view = toTicketViewDigestView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toTicketViewDigestViews([item, item]).length, 2, "views");
});
