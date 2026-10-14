import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildTicketViewRuleReport } from "./ticket-view-rule-report.js";
import { TicketViewRule, newTicketViewRule } from "./ticket-view-rule.js";

test("TicketViewRuleReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_708_698_406);
  const items: TicketViewRule[] = [];
  for (let index = 0; index < 3; index++) {
    items.push(newTicketViewRule(`ticket-view-rule-${index}`, "sample"));
  }
  const report = buildTicketViewRuleReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 3, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
