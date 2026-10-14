import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildTouchpointLedgerReport } from "./touchpoint-ledger-report.js";
import { TouchpointLedger, newTouchpointLedger } from "./touchpoint-ledger.js";

test("TouchpointLedgerReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_700_129_300);
  const items: TouchpointLedger[] = [];
  for (let index = 0; index < 3; index++) {
    items.push(newTouchpointLedger(`touchpoint-ledger-${index}`, "sample"));
  }
  const report = buildTouchpointLedgerReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 3, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
