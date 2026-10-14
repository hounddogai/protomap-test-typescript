import assert from "node:assert/strict";
import { test } from "node:test";
import { toTicketViewRuleView, toTicketViewRuleViews } from "./ticket-view-rule-view.js";
import { newTicketViewRule } from "./ticket-view-rule.js";

test("TicketViewRuleView shows the status in capitals", () => {
  const item = newTicketViewRule("code-544", "label-16");
  const view = toTicketViewRuleView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toTicketViewRuleViews([item, item]).length, 2, "views");
});
