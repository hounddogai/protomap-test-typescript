import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildRollingPlacementLedgerReport } from "./rolling-placement-ledger-report.js";
import { RollingPlacementLedger, newRollingPlacementLedger } from "./rolling-placement-ledger.js";

test("RollingPlacementLedgerReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_702_371_451);
  const items: RollingPlacementLedger[] = [];
  for (let index = 0; index < 4; index++) {
    items.push(newRollingPlacementLedger(`rolling-placement-ledger-${index}`, "sample"));
  }
  const report = buildRollingPlacementLedgerReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 4, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
