import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildRegionalTicketViewRecordReport } from "./regional-ticket-view-record-report.js";
import { RegionalTicketViewRecord, newRegionalTicketViewRecord } from "./regional-ticket-view-record.js";

test("RegionalTicketViewRecordReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_708_838_477);
  const items: RegionalTicketViewRecord[] = [];
  for (let index = 0; index < 2; index++) {
    items.push(newRegionalTicketViewRecord(`regional-ticket-view-record-${index}`, "sample"));
  }
  const report = buildRegionalTicketViewRecordReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 2, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
