import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildComplaintLedgerReport } from "./complaint-ledger-report.js";
import { ComplaintLedger, newComplaintLedger } from "./complaint-ledger.js";

test("ComplaintLedgerReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_703_758_429);
  const items: ComplaintLedger[] = [];
  for (let index = 0; index < 2; index++) {
    items.push(newComplaintLedger(`complaint-ledger-${index}`, "sample"));
  }
  const report = buildComplaintLedgerReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 2, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
