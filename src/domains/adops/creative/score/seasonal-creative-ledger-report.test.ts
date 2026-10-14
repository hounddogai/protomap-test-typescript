import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildSeasonalCreativeLedgerReport } from "./seasonal-creative-ledger-report.js";
import { SeasonalCreativeLedger, newSeasonalCreativeLedger } from "./seasonal-creative-ledger.js";

test("SeasonalCreativeLedgerReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_703_177_986);
  const items: SeasonalCreativeLedger[] = [];
  for (let index = 0; index < 5; index++) {
    items.push(newSeasonalCreativeLedger(`seasonal-creative-ledger-${index}`, "sample"));
  }
  const report = buildSeasonalCreativeLedgerReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 5, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
