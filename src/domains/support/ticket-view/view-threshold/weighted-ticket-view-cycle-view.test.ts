import assert from "node:assert/strict";
import { test } from "node:test";
import { toWeightedTicketViewCycleView, toWeightedTicketViewCycleViews } from "./weighted-ticket-view-cycle-view.js";
import { newWeightedTicketViewCycle } from "./weighted-ticket-view-cycle.js";

test("WeightedTicketViewCycleView shows the status in capitals", () => {
  const item = newWeightedTicketViewCycle("code-819", "label-198");
  const view = toWeightedTicketViewCycleView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toWeightedTicketViewCycleViews([item, item]).length, 2, "views");
});
