import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildFlightLedgerReport } from "./flight-ledger-report.js";
import { FlightLedger, newFlightLedger } from "./flight-ledger.js";

test("FlightLedgerReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_706_963_906);
  const items: FlightLedger[] = [];
  for (let index = 0; index < 5; index++) {
    items.push(newFlightLedger(`flight-ledger-${index}`, "sample"));
  }
  const report = buildFlightLedgerReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 5, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
