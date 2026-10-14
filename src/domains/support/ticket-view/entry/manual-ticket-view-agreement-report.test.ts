import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildManualTicketViewAgreementReport } from "./manual-ticket-view-agreement-report.js";
import { ManualTicketViewAgreement, newManualTicketViewAgreement } from "./manual-ticket-view-agreement.js";

test("ManualTicketViewAgreementReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_703_062_340);
  const items: ManualTicketViewAgreement[] = [];
  for (let index = 0; index < 3; index++) {
    items.push(newManualTicketViewAgreement(`manual-ticket-view-agreement-${index}`, "sample"));
  }
  const report = buildManualTicketViewAgreementReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 3, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
