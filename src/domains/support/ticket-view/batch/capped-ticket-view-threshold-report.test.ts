import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildCappedTicketViewThresholdReport } from "./capped-ticket-view-threshold-report.js";
import { CappedTicketViewThreshold, newCappedTicketViewThreshold } from "./capped-ticket-view-threshold.js";

test("CappedTicketViewThresholdReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_701_008_162);
  const items: CappedTicketViewThreshold[] = [];
  for (let index = 0; index < 5; index++) {
    items.push(newCappedTicketViewThreshold(`capped-ticket-view-threshold-${index}`, "sample"));
  }
  const report = buildCappedTicketViewThresholdReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 5, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
