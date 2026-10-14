import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildDefaultFlightLedgerReport } from "./default-flight-ledger-report.js";
import { DefaultFlightLedger, newDefaultFlightLedger } from "./default-flight-ledger.js";

test("DefaultFlightLedgerReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_702_164_290);
  const items: DefaultFlightLedger[] = [];
  for (let index = 0; index < 6; index++) {
    items.push(newDefaultFlightLedger(`default-flight-ledger-${index}`, "sample"));
  }
  const report = buildDefaultFlightLedgerReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 6, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
