import assert from "node:assert/strict";
import { test } from "node:test";
import {
  toWeightedTicketViewDigestView,
  toWeightedTicketViewDigestViews,
} from "./weighted-ticket-view-digest-view.js";
import { newWeightedTicketViewDigest } from "./weighted-ticket-view-digest.js";

test("WeightedTicketViewDigestView shows the status in capitals", () => {
  const item = newWeightedTicketViewDigest("code-43", "name-986");
  const view = toWeightedTicketViewDigestView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toWeightedTicketViewDigestViews([item, item]).length, 2, "views");
});
